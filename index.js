document.addEventListener('DOMContentLoaded', () => {
    fetch("https://frodeberg.github.io/Formulary2.0/data.json")
        .then(Response => Response.json())
        .then(data => {
            console.log(data);
        });
})
