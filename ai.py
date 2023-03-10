import json
import os
from itertools import combinations

actions = {}
paths = {}
n = 2

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
        for category in data["category"]["formulas"]:
            for equation in category["equations"]:
                formula = list(equation.keys())[0]
                formulas.append(formula)
                for new_formula in convert_formula(formula, []):
                    if new_formula not in formulas:
                        formulas.append(new_formula)
        formulas = format_formulas(formulas)

        # Every formula is a key for its left and right side 
        for formula in formulas:
            variables = get_variables(formula)
            for variable in variables[0]:
                result_variables.add(variable)
            for variable in variables[1]:
                using_variables.add(variable)
            if len(variables[0]) > 0 and len(variables[1]) > 0:
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


# Returns formulas with only one left-side variable
def format_formulas(formulas):
    new_list = []
    for formula in formulas:
        equals = formula.find("=")
        if len(list(filter(None, formula[:equals].split(" ")))) == 1:
            new_list.append(formula)
    return new_list

# Takes one formula and returns a list of equivalent formulas
def convert_formula(formula, explored = [], new_formulas = []):

    # Position of equals sign 
    equals = formula.find("=")
    operation = lambda char: operation_swap(formula, equals, char)
    operations = [
        swap(formula, equals), 
        operation("+"), 
        operation("-"), 
        operation("*"), 
        operation("/"),
        divisional_swap(formula, equals)
        ]

    for func in operations:
        left, right = get_variables(func)
        left, right = sorted(list(left)), sorted(list(right))
        if (left, right) not in explored:
            explored.append((left, right))
            new_formulas.append(func)
            convert_formula(func, explored)

    return new_formulas

# Swaps left and right side of formula
def swap(formula, equals):
    return formula[equals + 1:] + "=" + formula[:equals]

# Swap left side of equation to after divisor
def divisional_swap(formula, equals):
    right_side = formula[equals+1:]
    div = right_side.find("/")
    if div == -1:
        return formula
    
    return f"{right_side[div+1:]} = {formula[:equals]} / {right_side[:div]}"

# Returns start and end of parentheses or none 
def parentheses(string):
    start = string.find("(")
    if start:
        end = string.rfind(")")
        if end: 
            return (start, end)
    return None

# Returns -1 if x is between start and end 
between = lambda x, start, end: -1 if x > start and x < end else x

# Swaps + and -, unless they are sorrunded by parentheses 
def alternate(sub_string):
    new_string = ""
    for index, char in enumerate(sub_string):
        if not (index >= parentheses(sub_string)[0] and index <= parentheses(sub_string)[1]):
            if char == "+":
                new_string += "-"
                continue
            if char == "-":
                new_string += "+"
                continue
        new_string += char
    return new_string

# Swap based on operation
def operation_swap(formula, equals, operator):

    right_side = formula[equals + 1:]
    operation = right_side.find(operator)
    
    # check if inside parentheses 
    if parentheses(right_side):
        operation = between(operation, *parentheses(right_side))

     # Return if no + or - sign
    if operation < 0:
        return formula
    
    if operator in ["-", "+"]:
        return f" {formula[:equals].strip()} {alternate(operator)} {alternate(right_side[operation + 1:]).strip()} = {right_side[:operation].strip()} "

    # Swap arethmetically
    return multiplicational_swap(formula, equals, right_side, operator, operation)

# Multiplicational swap 
def multiplicational_swap(formula, equals, right_side, operator, operation):

    # Return if + or - not inside parentheses 
    if between(right_side.find("+"), *parentheses(right_side)) != -1 or between(right_side.find("-"), *parentheses(right_side)) != -1:
        return formula

    if operator == "/":
        operator = "*"
    else:
        operator = "/"
    return f" {formula[:equals].strip()} {operator} {right_side[operation + 1:].strip()} = {right_side[:operation].strip()} "


# Return left, right variables given a formula 
def get_variables(formula):
    left, right = set(), set()
    isleft = True
    for variable in formula.split(" "):
        if variable in ["="]:
            isleft = False 
        if "_" in variable:
            continue
        if variable in ["","=", " ", "/", "(", ")", "{", "}", "^", "*", "+", "-", "_", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]:
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

            # Checks if result can be made of new and old variables and dosent already exsits
            if all(variable in new_variables for variable in [result]):
                current_formula = formula
                for previous_formula in formulas[-1::-1]:
                    # If previous result is not in current 
                    if not all(left in actions[current_formula][1] for left in actions[previous_formula][0]):
                        break
                    current_formula = previous_formula
                else: 
                    combined_formula.append(formulas + [formula])
                continue

            for variable in new_variables:
                find_formula(result, available_variables + new_variables, formulas + [formula])


if __name__ == "__main__":
    main()