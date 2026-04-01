"""
Name: C Dunn
Program: 2025 Assignment
Date: 28/02/2026
"""
from dataclasses import dataclass


# CLASSES
# Order record setup using class
@dataclass
class order:
    orderNum: str=""
    orderDate: str=""
    email: str=""
    option: str=""
    cost: float=0.0
    rating: int=0


# FUNCTIONS
#Read data from orders.txt
def readOrders():
    #creates a blank array for orders
    orders=[]
    
    #opens the orders.txt file
    with open("orders.txt") as file:
        #reads each line in the file and stores the data in a records called 'newOrder'
        for line in file:
            data = line.strip().split(",")
            newOrder = order()
            newOrder.orderNum = data[0]
            newOrder.orderDate = data[1]
            newOrder.email = data[2]
            newOrder.option = data[3]
            newOrder.cost = float(data[4])
            newOrder.rating = int(data[5])
            
            #appends the filled newOrder record to the orders array 
            orders.append(newOrder)
    
    #returns the filled orders array
    return orders

# A function that reads through the array of records and returns the position of the winning order in a requested month.
# The function looks for the month (by creating a substring from the orderDate attribute and compares it to a month entered by the user.
# To qualify as a winner the order rating must also be 5.
def findWinner(orders):
    position = -1
    index = 0
    
    month = input("Enter a month:")
    while position == -1 and index < len(orders):
        if orders[index].orderDate[3:6] == month and orders[index].rating == 5:
            position = index
        index += 1
    
    return position

# A function that creates or overwrites a file called winningCustomer.txt.  It writes the order number, email address and order cost of the winning order to this file.
def writeWinner(position, orders):
    with open("winningCustomer.txt", "w") as file:
        if position >= 0:
            file.write(f"{orders[position].orderNum}, {orders[position].email}, {orders[position].cost}")
        else:
            file.write("No winner")

# Counts the number of orders with a particular option in the array, returns the total.
def countOption(orders, ordOption):
    total = 0
    
    for order in orders:
        if order.option == ordOption:
            total+=1
    
    return total

# The main program function, calls all of the other functions produces the required output statements.
def main():
    orders = readOrders()
    position = findWinner(orders)
    writeWinner(position, orders)
    delivery = countOption(orders, "Delivery")
    collection = countOption(orders, "Collection")
    print(f"There were {delivery} delivery orders.")
    print(f"There were {collection} collection orders.")


# MAIN PROGRAM
main()


            
            
        


        
