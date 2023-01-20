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
    console.log(category.equations)
    // Categories tab   
    nav = document.getElementById("categories")

    // Title for each category 
    h3 = document.createElement("h3");
    h3.innerHTML = category.title;
    nav.append(h3)

    // Formula and description for each equation
    category.equations.forEach(equation => {
        ul = document.createElement("ul");

        // Formula 
        li = document.createElement("li");
        li.innerHTML = Object.keys(equation)
        ul.append(li)

        // Description
        li.innerHTML = Object.values(equation)
        ul.append(li)
        nav.append(ul)
    });
}