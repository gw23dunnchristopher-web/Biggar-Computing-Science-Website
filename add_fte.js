#!/usr/bin/env node
/**
 * Adds "Find the Error" questions to every SDD page.
 * Run: node add_fte.js
 */
const fs = require('fs');

// ── All FTE question data ─────────────────────────────────────────────────────
// type: 'config_head'        N4 CONFIG  – quiz script in <head>, inject before closing pattern
// type: 'config_body'        N5/Higher CONFIG  – quiz script at bottom of body
// type: 'config_body_bare'   N5/Higher CONFIG  – same but closing is just }; before </script>
// type: 'configs_head'       N4 CONFIGS – QUIZ_CONFIGS object in head, add new key + body container
// type: 'none'               No quiz at all – add full infrastructure

const FTE = {

  // ── N4 SDD ─────────────────────────────────────────────────────────────────

  'HTML/N4/SDD/Analysis.html': {
    type: 'config_head',
    closingSearch: '\n                ],\n            };\n        </script>',
    indent: 20,
    intro: 'The following program is meant to ask the user for two numbers and display their sum. Find the error and explain how to fix it.',
    code: `num1 = input("Enter the first number: ")
num2 = input("Enter the second number: ")
total = num1 + num2
print("The total is:", total)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that num1 and num2 are stored as strings (no int() conversion), so the + operator concatenates them instead of adding them mathematically (e.g. entering 3 and 4 gives "34" instead of 7). Fix: change input() to int(input()) for both variables.'
  },

  'HTML/N4/SDD/Arithmetic.html': {
    type: 'configs_head',
    indent: 24,
    intro: 'The following program is meant to calculate the area of a rectangle. Find the error and explain how to fix it.',
    code: `length = int(input("Enter the length: "))
width = int(input("Enter the width: "))
area = length + width
print("The area is:", area)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that area = length + width uses addition instead of multiplication. The correct operator is *: area = length * width.'
  },

  'HTML/N4/SDD/combiningConstructs.html': {
    type: 'config_head',
    closingSearch: '\n                ],\n            };\n        </script>',
    indent: 20,
    intro: 'The following program is meant to count how many numbers from 1 to 10 are even. Find the error and explain how to fix it.',
    code: `count = 0
for number in range(1, 11):
if number % 2 == 0:
    count = count + 1
print("Even numbers found:", count)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that the if statement is not indented inside the for loop. It must be indented one level to be part of the loop body, otherwise Python raises an IndentationError.'
  },

  'HTML/N4/SDD/Design.html': {
    type: 'configs_head',
    indent: 24,
    pseudo: true,
    intro: 'The following pseudocode is meant to calculate the area of a rectangle. Find the error and explain how to fix it.',
    code: `RECEIVE length FROM (INTEGER) KEYBOARD
RECEIVE width FROM (INTEGER) KEYBOARD
SET area TO length + width
SEND "The area is " & area TO DISPLAY`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that SET area TO length + width uses addition instead of multiplication. It should be SET area TO length * width.'
  },

  'HTML/N4/SDD/fixedLoop.html': {
    type: 'config_head',
    closingSearch: '\n                ],\n            };\n        </script>',
    indent: 20,
    intro: 'The following program is meant to print the numbers 1 to 5. Find the error and explain how to fix it.',
    code: `for number in range(5):
    print(number)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that range(5) generates the numbers 0, 1, 2, 3, 4 — not 1 to 5. To print 1 to 5 the loop should use range(1, 6).'
  },

  'HTML/N4/SDD/readableCode.html': {
    type: 'config_head',
    closingSearch: '\n                ],\n            };\n        </script>',
    indent: 20,
    intro: 'The following program calculates the area of a rectangle but has two errors related to readable code. Find both errors.',
    code: `x = float(input("Enter the length: "))
y = float(input("Enter the width: "))
a = x * y
print("Result:", a)`,
    marks: 2,
    scheme: 'Award 1 mark for identifying that x and y are not meaningful variable names (should be length and width). Award 1 mark for identifying that a is not a meaningful variable name (should be area).'
  },

  'HTML/N4/SDD/runningTotal.html': {
    type: 'config_head',
    closingSearch: '\n                ],\n            };\n        </script>',
    indent: 20,
    intro: 'The following program is meant to add up five numbers entered by the user. Find the error and explain how to fix it.',
    code: `for count in range(5):
    total = 0
    number = int(input("Enter a number: "))
    total = total + number
print("The total is:", total)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that total = 0 is inside the loop, so it resets to zero on every iteration. The result will always be the last number entered rather than the sum of all five. Fix: move total = 0 to before the loop.'
  },

  'HTML/N4/SDD/Selection-elif.html': {
    type: 'config_head',
    closingSearch: '\n                ],\n            };\n        </script>',
    indent: 20,
    intro: 'The following program is meant to display a grade based on a mark. Find the error and explain how to fix it.',
    code: `mark = int(input("Enter your mark: "))
if mark >= 70:
    print("Grade: A")
if mark >= 50:
    print("Grade: B")
elif mark >= 30:
    print("Grade: C")
else:
    print("Grade: D")`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that the second if mark >= 50 should be elif mark >= 50. Using if instead of elif means a student scoring 70 or above would have both "Grade: A" and "Grade: B" printed.'
  },

  'HTML/N4/SDD/Selection.html': {
    type: 'config_head',
    closingSearch: '\n                ],\n            };\n        </script>',
    indent: 20,
    intro: 'The following program checks whether a person is old enough to vote. Find the error and explain how to fix it.',
    code: `age = int(input("Enter your age: "))
if age > 18:
    print("You are old enough to vote.")
else:
    print("You are not old enough to vote.")`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that if age > 18 should be if age >= 18. A person who is exactly 18 is old enough to vote, but the > operator (strictly greater than) would incorrectly tell them they cannot.'
  },

  'HTML/N4/SDD/TestingAndEvaluation.html': {
    type: 'config_head',
    closingSearch: '\n                ],\n            };\n        </script>',
    indent: 20,
    intro: 'The following program checks if a number is within the range 1 to 10 inclusive. Find the error and explain how to fix it.',
    code: `number = int(input("Enter a number: "))
if number > 1 and number < 10:
    print("In range")
else:
    print("Out of range")`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that > and < are strict inequalities, so the values 1 and 10 would be incorrectly reported as "Out of range". The operators should be >= and <= to include the boundary values.'
  },

  'HTML/N4/SDD/VariablesAndDatatypes.html': {
    type: 'configs_head',
    indent: 24,
    intro: 'The following program is meant to add two numbers together. Find the error and explain how to fix it.',
    code: `num1 = input("Enter the first number: ")
num2 = int(input("Enter the second number: "))
result = num1 + num2
print("The result is:", result)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that num1 is stored as a string (no int() conversion), so num1 + num2 will raise a TypeError because you cannot add a string and an integer. Fix: change input() to int(input()) for num1.'
  },

  // ── N4 NONE pages ─────────────────────────────────────────────────────────

  'HTML/N4/SDD/input.html': {
    type: 'none',
    intro: "The following program asks for a user's name and displays a greeting. Find the error and explain how to fix it.",
    code: `name = input("What is your name? ")
print("Hello, " + Name + "!")`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that Name should be name. Python is case-sensitive, so Name is treated as a different (undefined) variable, causing a NameError.'
  },

  'HTML/N4/SDD/print.html': {
    type: 'none',
    intro: "The following program displays a user's favourite colour. Find the error and explain how to fix it.",
    code: `colour = "blue"
print("My favourite colour is " + colour)
print("I have always liked the colour" colour)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that the second print statement is missing the + operator between the string and the variable colour. It should be print("I have always liked the colour" + colour).'
  },

  'HTML/N4/SDD/SDDUnitOutcomes.html': {
    type: 'none',
    intro: 'The following program is meant to display the 5 times table from 1 to 10. Find the error and explain how to fix it.',
    code: `for number in range(1, 11):
    print(number, "x 5 =", number + 5)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that number + 5 uses addition instead of multiplication. The correct expression is number * 5.'
  },

  // ── N5 SDD ─────────────────────────────────────────────────────────────────

  'HTML/N5/SDD/analysis.html': {
    type: 'config_body',
    closingSearch: '\n    ]};\n    </script>',
    indent: 4,
    intro: 'The following program is meant to calculate the average of three exam scores. Find the error and explain how to fix it.',
    code: `score1 = int(input("Enter score 1: "))
score2 = int(input("Enter score 2: "))
score3 = int(input("Enter score 3: "))
average = score1 + score2 + score3
print("Average score:", average)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that average = score1 + score2 + score3 calculates the total, not the average. It should be average = (score1 + score2 + score3) / 3.'
  },

  'HTML/N5/SDD/evaluation.html': {
    type: 'config_body',
    closingSearch: '\n    ]\n    };\n    </script>',
    indent: 4,
    intro: 'The following program checks whether a password is long enough (at least 8 characters). Find the error and explain how to fix it.',
    code: `password = input("Enter a password: ")
if len(password) > 8:
    print("Password accepted")
else:
    print("Password too short — must be at least 8 characters")`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that len(password) > 8 should be len(password) >= 8. A password of exactly 8 characters meets the requirement but would be incorrectly rejected by the > (strictly greater than) operator.'
  },

  'HTML/N5/SDD/testing.html': {
    type: 'config_body',
    closingSearch: '\n    ]\n    };\n    </script>',
    indent: 4,
    intro: 'A taxi charges £3.00 for the first mile and £1.50 for each additional mile. The following program calculates the cost. Find the error and explain how to fix it.',
    code: `miles = float(input("Enter the number of miles: "))
if miles <= 1:
    cost = 3.00
else:
    cost = 3.00 + (miles * 1.50)
print("Cost: £" + str(cost))`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that cost = 3.00 + (miles * 1.50) incorrectly charges £1.50 for ALL miles including the first. It should be cost = 3.00 + ((miles - 1) * 1.50) to only charge for each mile after the first.'
  },

  'HTML/N5/SDD/Design/flowcharts.html': {
    type: 'config_body',
    closingSearch: '\n        ]\n};\n    </script>',
    indent: 8,
    pseudo: true,
    intro: 'The following pseudocode is meant to find the largest of two numbers. Find the error and explain how to fix it.',
    code: `RECEIVE num1 FROM (INTEGER) KEYBOARD
RECEIVE num2 FROM (INTEGER) KEYBOARD
IF num1 < num2 THEN
    SET largest TO num1
ELSE
    SET largest TO num2
END IF
SEND "The largest number is " & largest TO DISPLAY`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that IF num1 < num2 is backwards. If num1 is smaller, the code incorrectly sets largest to num1. The condition should be IF num1 > num2.'
  },

  'HTML/N5/SDD/Design/pseudocode.html': {
    type: 'config_body',
    closingSearch: '\n        ]\n};\n    </script>',
    indent: 8,
    pseudo: true,
    intro: 'The following pseudocode is meant to count how many times a target value appears in a list. Find the error and explain how to fix it.',
    code: `SET count TO 1
FOR EACH item IN myList DO
    IF item = target THEN
        SET count TO count + 1
    END IF
END FOR EACH
SEND count TO DISPLAY`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that SET count TO 1 should be SET count TO 0. Starting the count at 1 means the final result will always be 1 more than the actual number of occurrences.'
  },

  'HTML/N5/SDD/Design/structureDiagrams.html': {
    type: 'config_body',
    closingSearch: '\n        ]\n};\n    </script>',
    indent: 8,
    intro: 'The following program is meant to count down from 10 to 1 and print each number. Find the error and explain how to fix it.',
    code: `for number in range(10, 0):
    print(number)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that range(10, 0) produces an empty sequence because Python defaults to a step of +1 and cannot count down. It should be range(10, 0, -1) to step backwards by 1 each time.'
  },

  'HTML/N5/SDD/Implementation/1DArrays.html': {
    type: 'config_body',
    closingSearch: '\n        ]\n};\n    </script>',
    indent: 8,
    intro: 'The following program stores 5 scores in an array and displays the last one. Find the error and explain how to fix it.',
    code: `scores = []
for i in range(5):
    score = int(input("Enter score: "))
    scores.append(score)
print("The last score is:", scores[5])`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that scores[5] causes an IndexError. Arrays are zero-indexed, so a 5-element array has valid indices 0 to 4. The last element is scores[4] (or scores[-1]).'
  },

  'HTML/N5/SDD/Implementation/DataTypes.html': {
    type: 'config_body',
    closingSearch: '\n        ]\n};\n    </script>',
    indent: 8,
    intro: 'The following program is meant to calculate the number of full days in a given number of hours. Find the error and explain how to fix it.',
    code: `hours = int(input("Enter the number of hours: "))
days = hours / 24
print("That is", days, "full days")`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that / performs regular (float) division, so 50 hours gives 2.0833... rather than 2 full days. The integer division operator // should be used: days = hours // 24.'
  },

  'HTML/N5/SDD/Implementation/InputVal.html': {
    type: 'config_body_bare',
    indent: 8,
    intro: 'The following program keeps asking for a mark until a valid one is entered (0 to 100). Find the error and explain how to fix it.',
    code: `mark = int(input("Enter a mark (0-100): "))
while mark < 0 or mark > 100:
    print("Invalid mark. Try again.")
mark = int(input("Enter a mark (0-100): "))
print("Mark accepted:", mark)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that the second input() call is outside the while loop due to incorrect indentation. It must be indented inside the loop, otherwise the loop repeats forever because mark never changes.'
  },

  'HTML/N5/SDD/Implementation/RunningTotal.html': {
    type: 'config_body_bare',
    indent: 8,
    intro: 'The following program is meant to calculate the total cost of items in a list. Find the error and explain how to fix it.',
    code: `prices = [1.99, 3.49, 0.79, 5.00, 2.25]
for price in prices:
    total = 0
    total = total + price
print("Total cost: £" + str(total))`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that total = 0 is inside the loop, resetting to zero on every iteration. After the loop, total equals only the last price. Fix: move total = 0 to before the loop.'
  },

  'HTML/N5/SDD/Implementation/Traversing1DArray.html': {
    type: 'config_body_bare',
    indent: 8,
    intro: 'The following program displays all items in a list that cost more than £5. Find the error and explain how to fix it.',
    code: `prices = [3.99, 7.50, 1.25, 9.99, 4.75, 6.00]
for i in range(len(prices)):
    if prices[i] > 5:
        print("£" + prices[i])`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that "£" + prices[i] tries to concatenate a string with a float, causing a TypeError. It should be print("£" + str(prices[i])) or use an f-string.'
  },

  // ── N5 NONE pages ─────────────────────────────────────────────────────────

  'HTML/N5/SDD/Dev_Methods.html': {
    type: 'none',
    intro: 'The following program is meant to display whether each number from 1 to 10 is odd or even. Find the error and explain how to fix it.',
    code: `for number in range(1, 11):
    if number / 2 == 0:
        print(number, "is even")
    else:
        print(number, "is odd")`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that number / 2 == 0 is incorrect. The / operator performs division and returns a float, so this condition is never True. The modulo operator % should be used: number % 2 == 0 checks whether the remainder after dividing by 2 is zero.'
  },

  'HTML/N5/SDD/Design/userInterface.html': {
    type: 'none',
    intro: "The following program calculates a user's BMI. Find the error and explain how to fix it.",
    code: `weight = float(input("Enter your weight in kg: "))
height = float(input("Enter your height in metres: "))
bmi = weight / height
print("Your BMI is:", round(bmi, 1))`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that bmi = weight / height divides by height once, but BMI is weight divided by height squared. It should be bmi = weight / (height ** 2).'
  },

  'HTML/N5/SDD/Implementation/Arithemtic.html': {
    type: 'none',
    intro: 'The following program converts a temperature from Celsius to Fahrenheit. Find the error and explain how to fix it.',
    code: `celsius = float(input("Enter temperature in Celsius: "))
fahrenheit = celsius * 9 / 5 + 32
print(str(celsius) + "C is " + fahrenheit + "F")`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that fahrenheit is a float and cannot be concatenated to a string using +. It must be converted first: str(fahrenheit). Fix: print(str(celsius) + "C is " + str(fahrenheit) + "F").'
  },

  'HTML/N5/SDD/Implementation/AssignConcat.html': {
    type: 'none',
    intro: 'The following program builds a full name from a first and last name. Find the error and explain how to fix it.',
    code: `firstName = input("Enter your first name: ")
lastName = input("Enter your last name: ")
fullName = firstName + lastName
print("Your full name is:", fullName)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that firstName + lastName joins the names with no space between them (e.g. "AliceSmith"). A space should be included: fullName = firstName + " " + lastName.'
  },

  'HTML/N5/SDD/Implementation/CombiningAlgorithms.html': {
    type: 'none',
    intro: 'The following program is meant to find the highest score from a list. Find the error and explain how to fix it.',
    code: `scores = [45, 72, 38, 91, 55]
largest = 0
for score in scores:
    if score < largest:
        largest = score
print("Highest score:", largest)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that if score < largest finds the minimum, not the maximum. The condition should be if score > largest. Also, initialising largest = 0 would fail if all scores were negative — it should be initialised to scores[0].'
  },

  'HTML/N5/SDD/Implementation/Loops.html': {
    type: 'none',
    intro: 'The following program is meant to add up all the numbers from 1 to 10. Find the error and explain how to fix it.',
    code: `total = 0
for number in range(10):
    total = total + number
print("Total:", total)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that range(10) generates numbers from 0 to 9 (missing 10). The correct range is range(1, 11). The program gives 45 instead of the correct answer of 55.'
  },

  'HTML/N5/SDD/Implementation/PreDefinedFunctions.html': {
    type: 'none',
    intro: 'The following program rounds a number to 2 decimal places. Find the error and explain how to fix it.',
    code: `number = float(input("Enter a decimal number: "))
rounded = round(number)
print("Rounded to 2 decimal places:", rounded)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that round(number) rounds to 0 decimal places (the nearest whole number). To round to 2 decimal places, the second argument must be supplied: round(number, 2).'
  },

  'HTML/N5/SDD/Implementation/Selection.html': {
    type: 'none',
    intro: 'The following program displays whether a student has achieved a Merit, Pass, or Fail. Find the error and explain how to fix it.',
    code: `score = int(input("Enter your score: "))
if score >= 50:
    print("Pass")
elif score >= 70:
    print("Merit")
else:
    print("Fail")`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that the conditions are in the wrong order. A student scoring 80 would be given "Pass" instead of "Merit" because score >= 50 is evaluated first. The >= 70 (Merit) check should come before the >= 50 (Pass) check.'
  },

  // ── Higher SDD ─────────────────────────────────────────────────────────────

  'HTML/Higher/SDD/Analysis.html': {
    type: 'config_body',
    closingSearch: '\n      ]\n};\n    </script>',
    indent: 6,
    intro: 'The following program calculates the average of a list of temperatures. Find the error and explain how to fix it.',
    code: `temperatures = [12.5, 18.3, 7.8, 22.1, 15.0]
total = 0
for i in range(len(temperatures)):
    total + temperatures[i]
average = total / len(temperatures)
print("Average temperature:", average)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that total + temperatures[i] calculates a value but does not assign it. total remains 0, so average is always 0. It should be total = total + temperatures[i] (or total += temperatures[i]).'
  },

  'HTML/Higher/SDD/DevMethodologies.html': {
    type: 'config_body',
    closingSearch: '\n      ]\n};\n    </script>',
    indent: 6,
    intro: 'The following function is meant to check whether a list of numbers is sorted in ascending order. Find the error and explain how to fix it.',
    code: `def is_sorted(numbers):
    for i in range(len(numbers)):
        if numbers[i] > numbers[i + 1]:
            return False
    return True

result = is_sorted([1, 3, 5, 7, 9])
print("Sorted:", result)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that when i reaches the last index, numbers[i + 1] goes out of bounds and causes an IndexError. The loop should use range(len(numbers) - 1) to stop one element short.'
  },

  'HTML/Higher/SDD/evaluation.html': {
    type: 'config_body',
    closingSearch: '\n      ]\n};\n    </script>',
    indent: 6,
    intro: 'The following program calculates the average score for students who passed (scored 60 or above). Find the error and explain how to fix it.',
    code: `scores = [55, 78, 43, 91, 62, 85, 70]
total = 0
count = 0
for score in scores:
    if score >= 60:
        total = total + score
average = total / count
print("Average passing score:", average)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that count is never incremented when a passing score is found (count += 1 is missing inside the if block), so dividing by count causes a ZeroDivisionError. Add count += 1 after total = total + score.'
  },

  'HTML/Higher/SDD/testing.html': {
    type: 'config_body',
    closingSearch: '\n      ]\n};\n    </script>',
    indent: 6,
    intro: 'The following function applies a discount to a price. Find the error and explain how to fix it.',
    code: `def apply_discount(price, member):
    discount = 0
    if member = True:
        discount = price * 0.1
    final_price = price - discount
    return final_price

print(apply_discount(50.00, True))`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that if member = True uses the assignment operator = instead of the comparison operator ==. This causes a SyntaxError. It should be if member == True: or simply if member:.'
  },

  'HTML/Higher/SDD/Design/pseudocode.html': {
    type: 'config_body',
    closingSearch: '\n      ]\n};\n    </script>',
    indent: 6,
    pseudo: true,
    intro: 'The following pseudocode is meant to find the minimum value in a list. Find the error and explain how to fix it.',
    code: `PROCEDURE find_minimum(numbers)
    SET minimum TO numbers[0]
    FOR index FROM 1 TO LEN(numbers) - 1 DO
        IF numbers[index] > minimum THEN
            SET minimum TO numbers[index]
        END IF
    END FOR
    RETURN minimum
END PROCEDURE`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that IF numbers[index] > minimum finds the maximum, not the minimum. The condition should be IF numbers[index] < minimum to update minimum when a smaller value is found.'
  },

  'HTML/Higher/SDD/Implementation/ArraysOfRecords.html': {
    type: 'config_body',
    closingSearch: '\n      ]\n};\n    </script>',
    indent: 6,
    intro: 'The following program searches a list of student records for those who achieved a top grade. Find the error and explain how to fix it.',
    code: `from dataclasses import dataclass

@dataclass
class Student:
    name: str
    grade: str

students = [Student("Alice", "A"), Student("Bob", "B"), Student("Carol", "A")]
for i in range(len(students)):
    if students[i].grade = "A":
        print(students[i].name, "achieved top grade")`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that students[i].grade = "A" uses the assignment operator = instead of the comparison operator ==. This causes a SyntaxError. It should be students[i].grade == "A".'
  },

  'HTML/Higher/SDD/Implementation/CountOccurences.html': {
    type: 'config_body_bare',
    indent: 6,
    intro: 'The following program counts how many times a target value appears in a list. Find the error and explain how to fix it.',
    code: `values = [3, 7, 2, 7, 5, 7, 1, 4, 7]
target = 7
count = 1
for value in values:
    if value == target:
        count = count + 1
print(target, "appears", count, "times")`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that count = 1 should be count = 0. Starting the counter at 1 means the result is always 1 more than the actual number of occurrences.'
  },

  'HTML/Higher/SDD/Implementation/FileHandling.html': {
    type: 'config_body_bare',
    indent: 6,
    intro: 'The following program reads from a file and then appends a new entry. Find the error and explain how to fix it.',
    code: `myFile = open("data.txt", "r")
for line in myFile:
    print(line)
myFile.close()

myFile = open("data.txt", "a")
myFile.write("New entry\n")`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that the file opened for appending ("a") is never closed. myFile.close() should be called after myFile.write(), or a with statement should be used to ensure the file is always closed properly.'
  },

  'HTML/Higher/SDD/Implementation/FindMinMax.html': {
    type: 'config_body_bare',
    indent: 6,
    intro: 'The following program finds the minimum and maximum values in a list. Find the error and explain how to fix it.',
    code: `numbers = [45, 12, 78, 3, 56, 91, 23]
minimum = 0
maximum = 0
for number in numbers:
    if number < minimum:
        minimum = number
    if number > maximum:
        maximum = number
print("Minimum:", minimum)
print("Maximum:", maximum)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that minimum = 0 is an incorrect starting value. Since all numbers in the list are positive, no number will ever be less than 0, so minimum stays at 0 instead of finding the true minimum. It should be initialised to numbers[0].'
  },

  'HTML/Higher/SDD/Implementation/LinearSearch.html': {
    type: 'config_body_bare',
    indent: 6,
    intro: 'The following linear search function contains an error. Find it and explain how to fix it.',
    code: `def linear_search(data, target):
    for i in range(len(data)):
        if data[i] == target:
            return i
    return i

names = ["Alice", "Bob", "Carol", "Dave"]
result = linear_search(names, "Eve")
print("Found at index:", result)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that return i after the loop returns the last index checked (3), not a "not found" indicator. If the target is absent, it incorrectly returns the final loop index. It should return -1 to indicate the target was not found.'
  },

  'HTML/Higher/SDD/Implementation/ParallelArrays.html': {
    type: 'config_body_bare',
    indent: 6,
    intro: "The following program displays each student's name alongside their score using parallel arrays. Find the error and explain how to fix it.",
    code: `names = ["Alice", "Bob", "Carol", "Dave"]
scores = [85, 92, 78, 95]
for i in range(len(names)):
    print(names[i], ":", scores[i + 1])`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that scores[i + 1] is off by one. When i equals 3 (the last valid index), i + 1 = 4 which is out of bounds, causing an IndexError. It should be scores[i].'
  },

  'HTML/Higher/SDD/Implementation/PredefinedFunctions.html': {
    type: 'config_body_bare',
    indent: 6,
    intro: 'The following program picks a random score from a list. Find the error and explain how to fix it.',
    code: `import random
scores = [45, 78, 23, 91, 56]
random_index = random.randint(0, len(scores))
print("Random score:", scores[random_index])`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that random.randint(0, len(scores)) can return len(scores) (which is 5), but valid indices for a 5-element list are 0 to 4. This causes an IndexError. It should be random.randint(0, len(scores) - 1).'
  },

  'HTML/Higher/SDD/Implementation/Subroutines.html': {
    type: 'config_body_bare',
    indent: 6,
    intro: 'The following function calculates the area of a rectangle but the result is lost. Find the error and explain how to fix it.',
    code: `def calculate_area(length, width):
    area = length * width

result = calculate_area(5, 3)
print("Area:", result)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that the function calculates area but has no return statement. Without return area, the function returns None, so result is None. Add return area as the last line of the function.'
  },

  'HTML/Higher/SDD/Implementation/Substrings.html': {
    type: 'config_body_bare',
    indent: 6,
    intro: 'The following program extracts the username from an email address (everything before the @ symbol). Find the error and explain how to fix it.',
    code: `email = "student@school.com"
username = email[0:email.index("@") + 1]
print("Username:", username)`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that email.index("@") + 1 includes the @ symbol in the result (e.g. "student@" instead of "student"). The + 1 should be removed: username = email[0:email.index("@")].'
  },

  'HTML/Higher/SDD/Implementation/VariableScope.html': {
    type: 'config_body',
    closingSearch: '\n      ]\n};\n    </script>',
    indent: 6,
    intro: 'The following program uses a function to calculate the total cost but cannot display the result. Find the error and explain how to fix it.',
    code: `def calculate_total(prices):
    total = 0
    for price in prices:
        total = total + price
    return total

my_prices = [1.99, 3.49, 5.00]
calculate_total(my_prices)
print("Total: £" + str(total))`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that the return value of calculate_total() is not stored, and total is a local variable that does not exist outside the function. Fix: result = calculate_total(my_prices) and change the print to use result: print("Total: £" + str(result)).'
  },

  // ── Higher NONE page ───────────────────────────────────────────────────────

  'HTML/Higher/SDD/Design/structureDiagrams.html': {
    type: 'none',
    intro: 'The following function is meant to return the second largest unique value in a list. Find the error and explain how to fix it.',
    code: `def second_largest(numbers):
    numbers.sort()
    return numbers[-2]

data = [3, 1, 4, 1, 5, 9, 2, 6]
print("Second largest:", second_largest(data))`,
    marks: 1,
    scheme: 'Award 1 mark for identifying that if the list contains duplicate maximum values, numbers[-2] returns the maximum again rather than the true second largest. The list should be deduplicated before sorting: numbers = list(set(numbers)); numbers.sort(); return numbers[-2].'
  },
};

// ── Processor ─────────────────────────────────────────────────────────────────

function buildFTEQuestion(data) {
  const pad = ' '.repeat(data.indent || 8);
  return `${pad}{
${pad}    type: "paragraph",
${pad}    text: [
${pad}        ${JSON.stringify(data.intro)},
${pad}        { type: "code", language: "python", content: ${JSON.stringify(data.code)} }
${pad}    ],
${pad}    marks: ${data.marks},
${pad}    markingScheme: ${JSON.stringify(data.scheme)}
${pad}}`;
}

function buildNoneHeadScript(data) {
  const q = buildFTEQuestion({ ...data, indent: 20 });
  return `        <script>
            window.QUIZ_CONFIG = {
                questions: [
${q}
                ]
            };
        </script>`;
}

let errors = [];
let successes = [];

Object.entries(FTE).forEach(([filepath, data]) => {
  if (!fs.existsSync(filepath)) {
    errors.push(`MISSING FILE: ${filepath}`);
    return;
  }

  let txt = fs.readFileSync(filepath, 'utf8');
  const block = buildFTEQuestion(data);

  // ── config_head: N4 pages with quiz script in <head> ───────────────────────
  if (data.type === 'config_head') {
    const pat = data.closingSearch;
    if (!txt.includes(pat)) {
      errors.push(`Pattern not found in ${filepath}: ${JSON.stringify(pat)}`);
      return;
    }
    const idx = txt.lastIndexOf(pat);
    txt = txt.slice(0, idx) + ',\n' + block + '\n' + txt.slice(idx);
  }

  // ── config_body: N5/Higher pages with quiz script in body ──────────────────
  else if (data.type === 'config_body') {
    const pat = data.closingSearch;
    if (!txt.includes(pat)) {
      errors.push(`Pattern not found in ${filepath}: ${JSON.stringify(pat)}`);
      return;
    }
    const idx = txt.lastIndexOf(pat);
    txt = txt.slice(0, idx) + ',\n' + block + '\n' + txt.slice(idx);
  }

  // ── config_body_bare: ends with };\n    </script> ───────────────────────────
  else if (data.type === 'config_body_bare') {
    // Find closing }; of QUIZ_CONFIG before </script>
    const scriptEndPat = '};\n    </script>';
    const scriptEnd = txt.indexOf(scriptEndPat);
    if (scriptEnd === -1) {
      errors.push(`Cannot find }; in ${filepath}`);
      return;
    }
    // Walk back to find closing ] of questions array
    let bracketPos = -1;
    for (let i = scriptEnd - 1; i >= 0; i--) {
      if (txt[i] === ']') { bracketPos = i; break; }
      // Skip past strings to avoid matching [ or ] inside strings
    }
    if (bracketPos === -1) {
      errors.push(`Cannot find ] in ${filepath}`);
      return;
    }
    txt = txt.slice(0, bracketPos) + ',\n' + block + '\n' + txt.slice(bracketPos);
  }

  // ── configs_head: N4 pages with QUIZ_CONFIGS in <head> ─────────────────────
  else if (data.type === 'configs_head') {
    // 1. Add findTheError key to QUIZ_CONFIGS in head
    const cfgStart = txt.indexOf('window.QUIZ_CONFIGS');
    if (cfgStart === -1) {
      errors.push(`Cannot find QUIZ_CONFIGS in ${filepath}`);
      return;
    }
    // Find the closing }; of QUIZ_CONFIGS (the }; followed by \n        </script>)
    const closingPat = '};\n        </script>';
    const configsEnd = txt.indexOf(closingPat, cfgStart);
    if (configsEnd === -1) {
      errors.push(`Cannot find QUIZ_CONFIGS closing in ${filepath}`);
      return;
    }
    // configsEnd is at the } of };
    // Walk backwards from configsEnd to find the last \n (start of the }; line)
    const lineStart = txt.lastIndexOf('\n', configsEnd - 1);
    // Insert new key before the \n            }; line
    const fteBlock2 = buildFTEQuestion({ ...data, indent: data.indent });
    const newKey = `
                findTheError: {
                    questions: [
${fteBlock2}
                    ]
                }`;
    txt = txt.slice(0, lineStart) + ',' + newKey + '\n' + txt.slice(lineStart + 1);

    // 2. Add quiz container in body (before third-to-last </div> before <footer>)
    if (!txt.includes('data-quiz-id="findTheError"')) {
      const footerIdx = txt.lastIndexOf('<footer>');
      if (footerIdx === -1) {
        errors.push(`Cannot find <footer> in ${filepath}`);
        return;
      }
      const d1 = txt.lastIndexOf('</div>', footerIdx - 1);
      const d2 = txt.lastIndexOf('</div>', d1 - 1);
      const d3 = txt.lastIndexOf('</div>', d2 - 1);
      const insertion = '\n                        <h2>Find the Error</h2>\n                        <div class="quiz-container" data-quiz-id="findTheError"></div>';
      txt = txt.slice(0, d3) + insertion + '\n' + txt.slice(d3);
    }
  }

  // ── none: add full quiz infrastructure ─────────────────────────────────────
  else if (data.type === 'none') {
    // 1. Add quiz.css link in head
    if (!txt.includes('quiz.css')) {
      txt = txt.replace('</head>', '        <link rel="stylesheet" href="/CSS/quiz.css" />\n    </head>');
    }
    // 2. Build head script and add quiz.js reference
    const headScript = buildNoneHeadScript(data);
    if (!txt.includes('QUIZ_CONFIG')) {
      // Try to insert before </head> which is now indented
      txt = txt.replace('    </head>', headScript + '\n        <script src="/JavaScript/quiz.js"></script>\n    </head>');
    }
    // 3. Add quiz container in body
    if (!txt.includes('quiz-container')) {
      const footerIdx = txt.lastIndexOf('<footer>');
      if (footerIdx === -1) {
        errors.push(`Cannot find <footer> in ${filepath}`);
        return;
      }
      const d1 = txt.lastIndexOf('</div>', footerIdx - 1);
      const d2 = txt.lastIndexOf('</div>', d1 - 1);
      const d3 = txt.lastIndexOf('</div>', d2 - 1);
      const insertion = '\n                        <h2>Find the Error</h2>\n                        <div class="quiz-container"></div>';
      txt = txt.slice(0, d3) + insertion + '\n' + txt.slice(d3);
    }
  }

  fs.writeFileSync(filepath, txt, 'utf8');
  successes.push(filepath);
});

console.log(`\n✓ Successfully updated ${successes.length} files:`);
successes.forEach(f => console.log('  ' + f));

if (errors.length > 0) {
  console.log(`\n✗ ${errors.length} errors:`);
  errors.forEach(e => console.log('  ' + e));
} else {
  console.log('\nNo errors!');
}
