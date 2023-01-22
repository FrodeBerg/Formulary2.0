import json
import os

actions = {}

def main():
    with open(f'{os. getcwd()}/data.json') as f:
        data = json.load(f)
        formulas = []
        variables = set()
        for equations in data["category"]:
            for equation in equations["equations"]:
                formulas.append(list(equation.keys())[0])

        for formula in formulas:
            left, right = set(), set()
            isleft = True
            for variable in formula.split(" "):
                if variable in ["="]:
                    isleft = False
                if variable not in ["","=", " ", "/", "(", ")", "^", "*", "+", "-", "_", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]:
                    if "^" in variable:
                        variable = variable[0: variable.find("^")]
                    variables.add(variable)
                    if isleft:
                        left.add(variable)
                    else:
                        right.add(variable)
            actions[tuple(right)] = [left, formula]

    print(actions)
    

    for result in variables:
        for variable1 in variables:
            if variable1 == result:
                continue
            for variable2 in variables:
                # Skip when variable 1 = variable 2 or if already at result 
                if variable2 == result or variable1 == variable2 or variable2 == result:
                    continue
                # Skip if path already exsits 
                path = actions.get(tuple([variable1, variable2]))
                if path:
                    if result in path[0]:
                        continue
        

                


    # For every end variable 
        # For every variable pair not resulting in variable 
            # For every variable tris not directly resulting in variables or have a pair in pairs 

# Add formula variants 
# Try every value from possible starting values to possible end values 

if __name__ == "__main__":
    main()