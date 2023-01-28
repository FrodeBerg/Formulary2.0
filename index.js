document.addEventListener('DOMContentLoaded', () => {
    get_data();
})

// Variables
let right_shift = 20;

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
        original_data.category.forEach(category => {
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
    original_data.category.forEach(category => {
        append_category(category)
    });
    if (categories.innerHTML == ""){
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

// Gets left and right variables for each function
function get_variables(variables){

    equal = variables.indexOf("=")
    if (equal == -1) return null

    left = []
    right = []
    for (let i = 0; i < variables.length; i++){
        if (i == "=" || i == "&") continue
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
        description.innerHTML = descriptions[formula];
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
        h3 = document.createElement("h3");
        h3.innerHTML = mathjax_formula(combined);
        hr = document.createElement("hr")
        div.prepend(hr, h3)
        nav.append(div)
    })


    return true
}


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
    // Formula and description for each equation
    category.equations.forEach(equation => {
        if (!check_formula(Object.keys(equation)[0])) return

        formula_exsits = true
        ul = document.createElement("ul");

        // Formula 
        formula = document.createElement("li");
        formula.innerHTML =  mathjax_formula(Object.keys(equation)[0]);
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
    if (restrictions["category"].length == 0) {
        return true
    }

    restrictions["category"].forEach(word => {
        title = category.title.toLowerCase();
        word = word.toLowerCase();
        if (title.includes(word)) return true;
    });

    return false
}

// Check formula to see if it matches restrictions 
function check_formula(formula) {
    let reg = "";
    let restriction = restrictions["formula"]
    let i = 0
    while (i < restriction.length){
        // If and skip
        if (restriction[i] == "&"){
            i++;
            continue;
        }
        // If equal add and skip
        reg += ".*"
        if (restriction[i] == "="){
            i++;
            reg += "=";
            continue;
        }

        // For every consecutive variable add a "|" between and enclose in "()"
        reg += "(" + restriction[i];
        while (restriction[i + 1] != "=" && restriction[i + 1] != "&" && i + 1 < restriction.length){
            reg += "|" + restriction[i+1]
            i++;            
        }
        reg += ")";
        i++;
    }

    reg = new RegExp(reg);
    return (reg.test(formula));
}

// Style all functions
function mathjax_formula(formula){

    formula = formula.replaceAll("*", "\\times");
    formula = formula.replaceAll("/", "\\over")

    return "\\[" + formula + "\\]";
}


// Function that understands what user types in 
function input(text) {

    // Clear previous restrictions
    restrictions["formula"] = []
    restrictions["category"] = []

    text = add_spaces(text, "=");
    text = add_spaces(text, "&")

    let words = text.split(/[\s]+/)
    words.forEach(word => {
        if (word == "") return
        // Words not in search_variables are counted as categorys 
        restriction = search_variables.indexOf(word) === -1 ? "category" : "formula";
        restrictions[restriction].push(word)            
    });
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


// Show variables on hover 
// Show active formulas and category
