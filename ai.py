import json
import os
from itertools import combinations

actions = {}
paths = {}
n = 4

result_variables = set()
using_variables = set()
combined_formula = []
pairs = set()

def main():

    global result_variables
    global using_variables

    with open(f'{os. getcwd()}/data.json') as f:
        data = json.load(f)
        formulas = []

        # Load data 
        for equations in data["category"]:
            for equation in equations["equations"]:
                formulas.append(list(equation.keys())[0])

        # Every formula is a key for its left and right side 
        for formula in formulas:
            variables = get_variables(formula)
            for variable in variables[0]:
                result_variables.add(variable)
            for variable in variables[1]:
                using_variables.add(variable)
            actions[formula] = variables

    print(actions)

    result_variables = sorted(list(result_variables))
    using_variables = sorted(list(using_variables))
    j = 0
    for result in result_variables:
        pairs.clear()
        print(j)
        combined_formulas = {}
        for i in range(n):
            combined_formulas.update(key_variables(result, i + 2))
        paths[result] = combined_formulas
        j += 1

    with open("ai.json", "w") as outfile:
        json.dump(paths, outfile, indent=4)

# Return left, right variables given a formula 
def get_variables(formula):
    left, right = set(), set()
    isleft = True
    for variable in formula.split(" "):
        if variable in ["="]:
            isleft = False
        if variable in ["","=", " ", "/", "(", ")", "^", "*", "+", "-", "_", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]:
            continue
        if "_" in variable:
            continue
        if "^" in variable:
            variable = variable[0: variable.find("^")]
        if isleft:
            left.add(variable)
        else:
            right.add(variable)
    return (left, right)


# Try all combinations with n variables 
def key_variables(result, n):
    combined_formulas = {}
    for variables in combinations(using_variables, n):
        variables = sorted(variables)
        if unique(variables, result):
            continue

        find_formula(result, list(variables))
        if combined_formula:
            combined_formulas[",".join(variables)] = combined_formula.copy()
            pairs.add(",".join(variables))
            combined_formula.clear()

    return combined_formulas


def unique(variables, result):
    # For every combination, if in exsisting keys return true
    for i in range(1, len(variables)):
        for combination in combinations(variables, i + 1):
            if ",".join(combination) in pairs:
                return True
    
    # If result in variables return true
    for variable in variables:
        if variable == result:
            return True
        
    return False

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

            if (formulas + [formula]) in combined_formula:
                continue
            # Checks if result can be made of new and old variables and dosent already exsits
            if all(variable in new_variables for variable in [result]):
                current_formula = formula
                for previous_formula in formulas[-1::-1]:
                    # If previous result is not in current 
                    if not all(left in get_variables(current_formula)[1] for left in get_variables(previous_formula)[0]):
                        break
                    current_formula = previous_formula
                else:
                    combined_formula.append(formulas + [formula])

            for variable in new_variables:
                find_formula(result, available_variables + new_variables, formulas + [formula])




if __name__ == "__main__":
    main()