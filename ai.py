import json
import os

actions = {}
paths = {}

result_variables = set()
using_variables = set()

def main():
    with open(f'{os. getcwd()}/data.json') as f:
        data = json.load(f)
        formulas = []

        # Load data 
        for equations in data["category"]:
            for equation in equations["equations"]:
                formulas.append(list(equation.keys())[0])

        # Every formula is a key for its left and right side 
        for formula in formulas:
            left, right = set(), set()
            isleft = True
            for variable in formula.split(" "):
                if variable in ["="]:
                    isleft = False
                if variable not in ["","=", " ", "/", "(", ")", "^", "*", "+", "-", "_", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]:
                    if "^" in variable:
                        variable = variable[0: variable.find("^")]
                    if isleft:
                        result_variables.add(variable)
                        left.add(variable)
                    else:
                        using_variables.add(variable)
                        right.add(variable)
            actions[formula] = [left, right]

    print(actions)
    i = 0
    for result in result_variables:
        print(i)
        path = {}
        for variable in using_variables:
            if variable == result:
                continue
            path[variable] = create_key(result, [variable])
        paths[result] = path
        i += 1
        
    with open("ai.json", "w") as outfile:
        json.dump(paths, outfile, indent=4)

# Populates dictionary with every resulting variable if no formula combination can be found 
def create_key(result, previous_variables = [], depth = 1):
    if depth > 3:
        return
    path = {}
    for variable in using_variables:
        if variable == result or variable in previous_variables:
            continue     
        
        combined_formulas = find_formula(result, previous_variables + [variable])
        if not combined_formulas:
            path[variable] = create_key(result, previous_variables + [variable], depth + 1)
        else:
            print(combined_formulas)
            path[variable] = combined_formulas

    return path

# Recursivly go deeper until end condition is met, either result variable or no new variables can be made 
def find_formula(result, available_variables, formulas = []):

    for formula in actions:
        # Checks if formula can be made 
        if all(variable in available_variables for variable in actions[formula][1]):
            # Checks if formula results in new variables 
            new_variables = []
            for variable in actions[formula][0]:
                if variable not in available_variables:
                    new_variables.append(variable)
            
            if len(new_variables) == 0:
                continue

            # Checks if result can be made of new and old variables 
            if all(variable in new_variables + available_variables for variable in result):
                return formulas + [formula]  
                 

            for variable in new_variables:
                return find_formula(result, available_variables + new_variables, formulas + [formula])




if __name__ == "__main__":
    main()