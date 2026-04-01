"""
Name: C Dunn
Program: 2024 Assignment
Date: 10/03/2026
"""

#FUNCTIONS

# A function to read data from a supplied file into a series of parallel arrays
def readFile():
    #blank arrays set up to hold data from file
    company = []
    numEmployees = []
    ceoSalary = []
    
    # Opening the file and splitting each line at ',' then appending the result to arrays. 
    with open("companies.csv") as file:
        for line in file:
            data = line.strip().split(",")
            company.append(data[0])
            numEmployees.append(int(data[1]))
            ceoSalary.append(int(data[2]))
    
    #returning the three filled arrays
    return company, numEmployees, ceoSalary

# A function to find the position of the largest number in an array
def findHighest(array):
    # Sets up initial values for the maximum number and its position
    maxPos = 0
    maximum = 0
    
    #Loops through the entire array, if the number is greater than the current max, updates the position and the maximum
    for x in range(len(array)):
        if array[x] > maximum:
            maximum = array[x]
            maxPos = x
    
    # returns the position of the maximum salary
    return maxPos

# A procedure to compare the salary of a company chosen by the user to the salary of the highest paid CEO
def salaryComparison(company, ceoSalary):
    #Asks user to enter the name of company they want to check.
    print("Enter the name of a company you would like to check:")
    userCompany = input()
    
    # Sets the found flag to false, the current index to 0 and calls the findHighest function to return the position of the company with the maximum CEO salary
    found = False
    index = 0
    maxPos = findHighest(ceoSalary)
    
    # Loops through the companies array looking for the entered company
    for x in range(len(company)):
        if company[x] == userCompany:
            found = True
            position = x
    
    # If the company has been found, deducts the chosen companies salary from the salary of the CEO who is paid the most.  
    if found == True:
        difference = ceoSalary[maxPos] - ceoSalary[position]
        print()
        print(f"{company[maxPos]} has the highest paid CEO.")
        print(f"The {company[position]} CEO earns £{difference} less than the highest paid CEO.")


# A procedure to find the highest number of employees that a company has, and count the number of companies within 10% of that
def employeeCounter(numEmployees):
    # Calls the findHighest function to find the highest number of employees and sets the counter for companies within 10% of that to 0
    maxEmployees = findHighest(numEmployees)
    count = 0
    # Loops through the entire numEmployees array
    for x in range(len(numEmployees)):
        # If the current number of employees is greater than or equal to 90% of the maximum, add 1 to the counter
        if numEmployees[x] >= (maxEmployees*0.9):
            count = count + 1
    
    # Display messages showing the highest number of employees and the number of companies within 10% of that.
    print()
    print(f"The highest number of employees employed by a single company is {maxEmployees}.")
    print(f"{count} companies employ within 10% of {maxEmployees}.")

# A function that calls all of the other function and starts the main program
def main():
    company, numEmployees, ceoSalary = readFile()
    salaryComparison(company, ceoSalary)
    employeeCounter(numEmployees)

# MAIN PROGRAM
main()
            
            
    
    
    
    
            