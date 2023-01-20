document.addEventListener('DOMContentLoaded', () => {
    get_data();
})

function get_data() {
    fetch("https://frodeberg.github.io/Formulary2.0/data.json")
    .then(Response => Response.json())
    .then(data => {
        // Parse data and loop through every category
        data.category.forEach(category => {
            append_category(category)
        })
    });
}

function append_category(category) {
    // Categories tab   
    nav = document.getElementById("categories")

    // Title and hr for each category 
    hr = document.createElement("hr")
    h4 = document.createElement("h4");
    h4.innerHTML = category.title;
    nav.append(hr, h4)

    // Formula and description for each equation
    category.equations.forEach(equation => {
        ul = document.createElement("ul");

        // Formula 
        formula = document.createElement("li");
        formula.innerHTML = Object.keys(equation)
        ul.append(formula)

        // Description
        description = document.createElement("li")
        description.innerHTML = Object.values(equation)
        ul.append(description)
        nav.append(ul)
    });
}