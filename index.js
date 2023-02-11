document.addEventListener('DOMContentLoaded', () => {
    get_data();
    document.querySelector("input").focus();
    document.getElementById("info").style.opacity = "1";
})

// Detect first user interaction to tutorial message
function first_interaction() {
    let info = document.getElementById("info");
    let helpers = document.getElementById("helpers")
    // Fade
    info.style.opacity = "0";
    helpers.style.opacity = "1";
    helpers.style.display = "inline";

    info.addEventListener("transitionend", () => {
        document.getElementById("info").style.display = "none";
    })    
}


// Variables
let right_shift = 20;
let variable_offset = 30;
let previous_variables = null;

// Restrictions filled with regex patterns for category, formula, variable 
let restrictions = {
    "category": [],
    "formula": []
}

// Original data containging all formulas, categories, and descriptions
let original_data = [];
let descriptions = {};
let ai_data = null;
let search_variables = [];
let unit_variables = [];



// ---------- Data extraction functions ----------
function get_data() {
    fetch("https://formulary.link/ai.json")
    .then(Response => Response.json())
    .then(data => {
        ai_data = data;
    })
    fetch("https://formulary.link/data.json")
    .then(Response => Response.json())
    .then(data => {
        Object.values(data.category).forEach(category => {
            original_data = original_data.concat(category);
        })
        original_data.forEach(category => {
            category.equations.forEach(equation => {
                let formula = Object.keys(equation)[0];
                (formula.split(" ")).forEach(variable => {
                    if (search_variables.indexOf(variable) !== -1) return;
                    search_variables.push(variable)   
                });
            });
        });
        unit_variables = data.category.variables;
        get_categories();
    });
}



// ---------- HTML generating functions ----------

function get_categories() {
    // Reset main page
    let help = document.getElementById("help");
    help.style.display = "none";
    categories = document.getElementById("categories");
    categories.innerHTML = "";
    // Loop through every category
    original_data.forEach(category => {
        append_category(category);
    });
    if (categories.innerHTML == ""){

        let variables = null;

        if (restrictions["formula"].length > 0){
            variables = get_variables(restrictions["formula"]);
        }
        // Try and find combined formula for each combination
        successful = false

        if (variables){
            combinations = get_combinations(variables[1])
            combinations.forEach(combination => {
                if (combined_formula(variables[0], combination)) successful = true
            })
        }
        // If no combined formula show help display
        if (!successful) help.style.display = "block";
    }
    MathJax.typeset();
}

// Adds each category 
function append_category(category) {

    if (!check_category(category)) return
    
    // Categories tab   
    let nav = document.getElementById("categories")
    let div = document.createElement("div")

    // Title and hr for each category 
    hr = document.createElement("hr")
    h4 = document.createElement("h4");
    h4.innerHTML = category.title;
    div.append(hr, h4)

    let formula_exsits = false
    // Formula and description for each equation and si-equation
    category.equations.forEach(equation => {
        let formula = Object.keys(equation)[0];
        if (!check_formula(formula)) return

        formula_exsits = true

        descriptions[Object.keys(equation)[0]] = Object.values(equation)
        append_formula(formula, div)
    });
    if (formula_exsits) nav.append(div);
}

// Combines formulas and adds them to DOM 
function combined_formula(left, right){

    key = right.sort().join(",").toString();
    // Check if formula exsists for query 
    if (!ai_data.hasOwnProperty(left)) return false
    if (!ai_data[left].hasOwnProperty(key)) return false

    nav = document.getElementById("categories")

    // Loop through each list of formulas for given key 
    ai_data[left][right].forEach(list => {

        div = document.createElement("div")

        combined = null;
        i = 1;

        list.slice().reverse().forEach(formula => {
        
            // Add each formula
            append_formula(formula, div)

            // Right shift for style 
            div.lastChild.children[0].style.marginLeft = `${i * right_shift}px`

            // Combined formula
            if (combined){
                equal = formula.indexOf("=");
                combined = combined.replace(formula.slice(0, equal).replace(/\s/g, ''), "(" + formula.slice(equal + 1) + ")")
            }
            else combined = formula;
            i++;
        })

        // Append combined formula
        let equation = append_equation(combined);
        ul = document.createElement("ul");
        equation.style.fontSize = "20px";
        equation.style.marginTop = "20px";
        hr = document.createElement("hr");
        ul.append(equation);
        if (i <= 2) div.innerHTML = "";
        div.prepend(hr, ul)
        nav.append(div)
    });
    return true
}

// Adds description and formula
function append_formula(formula, div) {

    ul = document.createElement("ul");

    // Formula 
    let equation = append_equation(formula);
    ul.append(equation);

    // Description
    description = document.createElement("li")
    description.innerHTML = "";
    if (descriptions.hasOwnProperty(formula)){
        description.innerHTML = descriptions[formula];
    }    
    ul.append(description)
    div.append(ul)
}

function append_equation(formula){
    equation = document.createElement("li");

    equation.innerHTML = mathjax_formula(formula);

    equation.setAttribute("onmouseenter", `show_variables("${formula}", this)`);
    equation.setAttribute("onmouseleave", "hide_variables()");

    return equation;
}



// ---------- Helper Functions ----------

// Returns all combinations of how variables can be combined
function get_combinations(variables){

    let combinations = [];
    let length = variables.length;
    let combinations_length = 2 ** length;

    // Loops through each possible combination
    for (let i = 0; i < combinations_length; i++){
        pair = [];
        for (let j = 0; j < length; j++){
            if (i & 2 ** j) pair.push(variables[j]);
        }

        if (pair.length > 0) {
            combinations.push(pair);           
        } 
    }
    return combinations;
}

// Takes formula Returns left, right variables
function get_variables(variables){

    if (typeof variables == "string") {
        variables = variables.split(" ")
    }
    equal = variables.indexOf("=")
    if (equal == -1) return null

    left = []
    right = []
    for (let i = 0; i < variables.length; i++){
        let variable = variables[i];
        if (i == "=" || variable == "") continue

        // Include variables with exponents
        let symbol = variable.indexOf("^");
        if (symbol != -1) variable = variable.slice(0, symbol);

        if (i < equal){
            left.push(variable);
        }
        if (i > equal){
            right.push(variable);
        }
    }
    if (left.length == 0 || right.length == 0) return null

    return [left, right]
}

// All permutations of an array 
function get_permutations(aviable_variables, str = "", permutations = []){
    let variable_length = aviable_variables.length;
    // Check if end condition
    if (variable_length == 0){
        permutations.push("(" + str + ")");
        return
    }

    // Loop through all variables 
    for (let i = 0; i < variable_length; i++){
        new_variables = aviable_variables.slice();
        new_variables.splice(i, 1)
        get_permutations(new_variables, (`${str}.*[${aviable_variables.slice(i, i + 1)}].*`), permutations)
    }
    return permutations
}


// Style all functions
function mathjax_formula(formula){

    formula = formula.replaceAll("*", "\\times");

    // Loop through all "/"
    let index = 0
    let div = formula.indexOf("/", index);
    while (div >= 0){

        // Loop going forward in string
        let i = find_braces(formula, div, 1);
        formula = formula.slice(0, div + i) + " }" + formula.slice(div + i);

        // Loop going backward in string
        i = find_braces(formula, div, -1);
        formula = formula.slice(0, div + i + 1) + "{ " + formula.slice(div + i + 1);

        // Take the two added characters before the "/" into account 
        index = div + 2;
        div = formula.indexOf("/", index + 1);
    }
    formula = formula.replaceAll("/", "\\over");
    return "\\[" + formula + "\\]";
}

// Find position for curly braces, parentheses taken into account 
function find_braces(formula, div, direction){
    let parentheses = 0
    let i = 2 * direction;
    while (!(formula[div + i] == " " && formula[div + i - 1 * direction] != " " && !parentheses)){
        if (formula[div + i] == "(") parentheses += 1 * direction;
        if (formula[div + i] == ")") parentheses += -1 * direction;
        i += 1 * direction;
    }
    return i
}

// Add spaces to prevent bugs if user didnt put spaces 
function add_spaces(text, char){
    let equal = text.indexOf(char);
    if (equal !== -1){
        text = text.substring(0, equal) + " " + text[equal] + " " + text.substring(equal + 1, text.length);
    } 
    return text
}



// ---------- Restriction functions ----------
// Check every category to see if it exsists in restrictions 
function check_category(category) {

    let exsists = false
    if (restrictions["category"].length == 0) {
        return true
    }
    restrictions["category"].forEach(word => {
        title = category.title.toLowerCase();
        word = word.toLowerCase();
        if (title.includes(word)) exsists = true;
    });

    return exsists
}

// Check formula to see if it matches restrictions using regex 
function check_formula(formula) {
    let reg = "";
    let restriction = restrictions["formula"];
    // Check if user typed somthing
    if (restriction.length !== 0){
        let equal = restriction.indexOf("=");

        // if equals sign, split into left and right and add to regex
        if (equal == -1){
            reg = get_permutations(restriction.slice()).join("|").toString();
        }
        else{

            // Makes regex order insensetive before and after "=" sign
            let left = get_permutations(restriction.slice(0, equal));
            if (left) left = "(" + left.join("|").toString() + ")";
            else left = "";
            let right = get_permutations(restriction.slice(equal + 1));
            if (right) right = "(" + right.join("|").toString() + ")";
            else right = "";
            
            reg = `${left}=${right}`
        }
    }
    reg = new RegExp(reg);
    return (reg.test(formula));
}



// ---------- Show and Hide functions ----------

// Find variables, show variables 
function show_variables(formula, element){
    let variable_div = document.getElementById("variables");

    // Append the right variables 
    let variables = get_variables(formula);
    variables = variables[0].concat(variables[1])
    unit_variables.forEach(category => {
        category.equations.forEach(equation => {

            equation = Object.keys(equation)[0];
            let variable = (equation.slice(0, equation.indexOf("=")));

            variable = variable.replace(/\s+/g, '');
            if (equation == formula) return;
            if (variables.indexOf(variable) != -1) {
                p = document.createElement("p");
                p.innerHTML = equation;
                variable_div.append(p);
            }
        });
    });
    if (variable_div.innerHTML == "") return;
    variable_div.style.display = "block";

    // Hide if scroll
    onscroll = () => hide_variables();
    

    // Updates position of variables 
    variable_div.style.top = `${element.getBoundingClientRect().top - (variable_div.offsetHeight - element.offsetHeight) / 2}px`;
    variable_div.style.left = `${element.offsetWidth + variable_offset + element.getBoundingClientRect().left}px`;
    element.style.paddingLeft = "10px";
    previous_variables = element;
}

// Hide variables on mouse exit
function hide_variables(){
    if (previous_variables == null) return;
    let variable_div = document.getElementById("variables");
    variable_div.style.display = "none";
    variable_div.innerHTML = "";
    previous_variables.style.paddingLeft = "0px";
}



// ---------- Input ----------
// Function that understands what user types in 
function input(text) {

    // hide help message
    first_interaction();

    // Clear previous restrictions
    restrictions["formula"] = []
    restrictions["category"] = []

    text = add_spaces(text, "=");

    let words = text.split(/[\s]+/)
    words.forEach(word => {
        if (word == "") return
        // Words not in search_variables are counted as categories 
        restriction = search_variables.indexOf(word) === -1 ? "category" : "formula";
        restrictions[restriction].push(word)            
    });

    // Display what user typed in after classification
    let variables = document.getElementById("search_variables");
    let categories = document.getElementById("search_categories");

    variables.innerHTML = "Searching for variables: " + restrictions["formula"].join(" ");
    categories.innerHTML = "Searching for categories: " + restrictions["category"].join(" ");

    get_categories()
    hide_variables();
}
