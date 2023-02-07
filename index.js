document.addEventListener('DOMContentLoaded', () => {
    get_data();
})

// Cover user interaction
document.onclick = function() {
    document.getElementById("helpers").style.display = "inline";
    document.getElementById("info").style.display = "none";
}
document.onkeydown = function() {
    document.getElementById("helpers").style.display = "inline";
    document.getElementById("info").style.display = "none";
}


// Variables
let right_shift = 20;
let variable_offset = 20;

// Restrictions filled with regex patterns for category, formula, variable 
let restrictions = {
    "category": [],
    "formula": []
}

// Original data containging all formulas, categories, and descriptions
let original_data = null;
let descriptions = {};
let ai_data = null;
let search_variables = [];
let unit_variables = [];


function get_data() {
    fetch("https://frodeberg.github.io/Formulary2.0/ai.json")
    .then(Response => Response.json())
    .then(data => {
        ai_data = data;
    })
    fetch("https://frodeberg.github.io/Formulary2.0/data.json")
    .then(Response => Response.json())
    .then(data => {
        original_data = data;
        // Find every variable in every formula 
        original_data.category.formulas.forEach(category => {
            category.equations.forEach(equation => {
                variables = Object.keys(equation)[0].split(" ")
                variables.forEach(variable => {
                    if (search_variables.indexOf(variable) !== -1) return;
                    search_variables.push(variable)
                });
            });
        });
        get_categories();
    });
}


function get_categories() {
    // Reset main page
    let help = document.getElementById("help");
    help.style.display = "none";
    categories = document.getElementById("categories");
    categories.innerHTML = "";
    // Loop through every category
    Object.values(original_data.category).forEach(category => {
        category.forEach(equation => {
            append_category(equation);
        });
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
        if (!successful) help.style.display = "block";
    }
    MathJax.typeset();
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
        if (i == "=" || variables[i] == "") continue
        if (i < equal){
            left.push(variables[i]);
        }
        if (i > equal){
            right.push(variables[i]);
        }
    }
    if (left.length == 0 || right.length == 0) return null

    return [left, right]
}


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


// Combined formulas and adds them to DOM 
function combined_formula(left, right){

    key = right.sort().join(",").toString();
    // Check if formula exsists for query 
    if (!ai_data.hasOwnProperty(left)) return false
    if (!ai_data[left].hasOwnProperty(key)) return false

    nav = document.getElementById("categories")

    // Loop through each formula for given key 
    ai_data[left][right].forEach(equation => {

        div = document.createElement("div")

        combined = null;
        i = 1;

        equation.slice().reverse().forEach(formula => {
        
            // Add each formula and description to ul
            ul = document.createElement("ul");
            li = document.createElement("li");
            li.innerHTML = mathjax_formula(formula);
            li.style.marginLeft = `${i * right_shift}px` 
            description = document.createElement("li");
            description.innerHTML = "";
            if (descriptions.hasOwnProperty(formula)){
                description.innerHTML = descriptions[formula];
            }
            li.setAttribute("onmouseenter", `show_variables("${formula}", this)`)
            li.setAttribute("onmouseleave", "hide_variables()")
            ul.append(li, description);
            div.append(ul);

            // Combined formula
            if (combined){
                equal = formula.indexOf("=");
                combined = combined.replace(formula.slice(0, equal).replace(/\s/g, ''), "(" + formula.slice(equal + 1) + ")")
            }
            else combined = formula;
            i++;
        })

        // Append combined formula
        let final_formula = document.createElement("li");
        final_formula.innerHTML = mathjax_formula(combined);
        final_formula.setAttribute("onmouseenter", `show_variables("${combined}", this)`);
        final_formula.setAttribute("onmouseleave", "hide_variables()");
        final_formula.style.fontSize = "20px";
        final_formula.style.marginTop = "20px";
        hr = document.createElement("hr");
        if (i <= 2) div.innerHTML = "";
        div.prepend(hr, final_formula)
        nav.append(div)
    })
    return true
}


// Adds each category 
function append_category(category) {

    if (!check_category(category)) return
    
    // Categories tab   
    nav = document.getElementById("categories")
    div = document.createElement("div")

    // Title and hr for each category 
    hr = document.createElement("hr")
    h4 = document.createElement("h4");
    h4.innerHTML = category.title;
    div.append(hr, h4)

    let formula_exsits = false
    // Formula and description for each equation and si-equation
    category.equations.forEach(equation => {
        let current_formula = Object.keys(equation)[0];
        if (!check_formula(current_formula)) return

        formula_exsits = true
        ul = document.createElement("ul");

        // Formula 
        formula = document.createElement("li");
        formula.innerHTML =  mathjax_formula(current_formula);
        formula.setAttribute("onmouseenter", `show_variables("${current_formula}", this)`);
        formula.setAttribute("onmouseleave", "hide_variables()");
        ul.append(formula)

        // Description
        description = document.createElement("li")
        description.innerHTML = Object.values(equation)
        descriptions[Object.keys(equation)[0]] = Object.values(equation)
        ul.append(description)
        div.append(ul)
    });
    if (formula_exsits) nav.append(div);
}


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
 
// Find variables, show variables 
function show_variables(formula, element){
    let variable_div = document.getElementById("variables");
    variable_div.style.display = "block";

    // Append the right variables 
    let variables = get_variables(formula);
    variables = variables[0] + variables[1]
    original_data.category.variables.forEach(category => {
        category.equations.forEach(equation => {
            formula = Object.keys(equation)[0];
            let variable = (formula.slice(0, formula.indexOf("=")));
            variable = variable.replace(/\s+/g, '')
            if (variables.indexOf(variable) != -1) {
                p = document.createElement("p");
                p.innerHTML = formula;
                variable_div.append(p);
            }
        });
    });

    // Hide if scroll 
    onscroll = function(){
        hide_variables();
    }

    // Updates position of variables 
    variable_div.style.top = `${element.getBoundingClientRect().top - (variable_div.offsetHeight - element.children[0].offsetHeight) / 2}px`;
    variable_div.style.left = `${element.children[0].offsetWidth + variable_offset + element.getBoundingClientRect().left}px`;
}

// Hide variables on mouse exit
function hide_variables(){
    let variable_div = document.getElementById("variables");
    variable_div.style.display = "none";
    variable_div.innerHTML = "";
}

// Function that understands what user types in 
function input(text) {

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
}


// Add spaces to prevent bugs if user didnt put spaces 
function add_spaces(text, char){
    let equal = text.indexOf(char);
    if (equal !== -1){
        text = text.substring(0, equal) + " " + text[equal] + " " + text.substring(equal + 1, text.length);
    } 
    return text
}
