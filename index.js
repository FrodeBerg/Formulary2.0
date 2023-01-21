document.addEventListener('DOMContentLoaded', () => {
    get_data();
})

// Restrictions filled with regex patterns for category, formula, variable 
let restrictions = {
    "category": [],
    "formula": []
}

// Original data containging all formulas and categories
let original_data = null

function get_data() {
    fetch("https://frodeberg.github.io/Formulary2.0/data.json")
    .then(Response => Response.json())
    .then(data => {
        original_data = data
        get_categories()
    });
}

function get_categories() {
    document.getElementById("categories").innerHTML = "";
    // Loop through every category
    original_data.category.forEach(category => {
        append_category(category)
    });
}

function append_category(category) {
    if (check_category(category)) {
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
            if (check_formula(Object.keys(equation)[0])){
                formula_exsits = true
                ul = document.createElement("ul");

                // Formula 
                formula = document.createElement("li");
                formula.innerHTML = Object.keys(equation)
                ul.append(formula)

                // Description
                description = document.createElement("li")
                description.innerHTML = Object.values(equation)
                ul.append(description)
                div.append(ul)
            }
        });
        if (formula_exsits) nav.append(div);
    }
}

// Check every category to see if it exsists in restrictions 
function check_category(category) {
    valid = false
    if (restrictions["category"].length == 0) {
        return true
    }

    restrictions["category"].forEach(word => {
        title = category.title.toLowerCase();
        word = word.toLowerCase();
        if (title.includes(word)) valid = true;
    });

    return valid
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

// Function that understands what user types in 
function input(text) {

    // Clear previous restrictions
    restrictions["formula"] = []
    restrictions["category"] = []

    words = text.split(" ")
    words.forEach(word => {
        if (word != "") {
            // Words over length 2 is counted as category otherwise as variable in formula  
            restriction = word.length > 2 ? "category" : "formula";
            restrictions[restriction].push(word)            
        }
    });
    get_categories()
}


// Ai functions to solve formulas 

