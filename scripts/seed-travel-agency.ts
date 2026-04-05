import { db } from "../server/db";
import {
  dsDatabases, dsTables, dsFields, dsRecords, dsEmbeds, dsRelationships
} from "../shared/ds-schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

if (!db) { console.error("No DB"); process.exit(1); }

async function main() {
  console.log("Creating Travel Agency database...");

  const [database] = await db!.insert(dsDatabases).values({
    name: "Travel Agency",
    userId: "teacher_system",
  }).returning();
  console.log("Database created:", database.id);

  /* ── Resort table ── */
  const [resortTable] = await db!.insert(dsTables).values({ name: "Resort", databaseId: database.id }).returning();
  const resortFieldRows = await db!.insert(dsFields).values([
    { name: "resortID",   fieldType: "Short Text", isPrimaryKey: true,  isRequired: true,  sortOrder: 0, tableId: resortTable.id, fieldSize: 10 },
    { name: "resortName", fieldType: "Short Text", isPrimaryKey: false, isRequired: true,  sortOrder: 1, tableId: resortTable.id, fieldSize: 50 },
    { name: "resortType", fieldType: "Short Text", isPrimaryKey: false, isRequired: true,  sortOrder: 2, tableId: resortTable.id, fieldSize: 20 },
  ]).returning();
  const resortIdField = resortFieldRows[0];

  const resortRecords = [
    { resortID: "R1", resortName: "Ayr",          resortType: "Coastal"  },
    { resortID: "R2", resortName: "Fort William",  resortType: "Highland" },
    { resortID: "R3", resortName: "St Andrews",    resortType: "Coastal"  },
    { resortID: "R4", resortName: "Inverness",     resortType: "Highland" },
    { resortID: "R5", resortName: "Edinburgh",     resortType: "City"     },
    { resortID: "R6", resortName: "Aviemore",      resortType: "Highland" },
    { resortID: "R7", resortName: "Oban",          resortType: "Coastal"  },
    { resortID: "R8", resortName: "Aberfeldy",     resortType: "Highland" },
    { resortID: "R9", resortName: "Anstruther",    resortType: "Coastal"  },
  ];
  await db!.insert(dsRecords).values(resortRecords.map(r => ({ tableId: resortTable.id, databaseId: database.id, data: r })));
  console.log("Resort table seeded.");

  /* ── Hotel table ── */
  const [hotelTable] = await db!.insert(dsTables).values({ name: "Hotel", databaseId: database.id }).returning();
  const hotelFieldRows = await db!.insert(dsFields).values([
    { name: "hotelRef",        fieldType: "Short Text", isPrimaryKey: true,  isRequired: true,  sortOrder: 0, tableId: hotelTable.id, fieldSize: 10 },
    { name: "hotelName",       fieldType: "Short Text", isPrimaryKey: false, isRequired: true,  sortOrder: 1, tableId: hotelTable.id, fieldSize: 60 },
    { name: "resortID",        fieldType: "Short Text", isPrimaryKey: false, isRequired: true,  sortOrder: 2, tableId: hotelTable.id, fieldSize: 10 },
    { name: "starRating",      fieldType: "Number",     isPrimaryKey: false, isRequired: true,  sortOrder: 3, tableId: hotelTable.id },
    { name: "swimmingPool",    fieldType: "Yes/No",     isPrimaryKey: false, isRequired: false, sortOrder: 4, tableId: hotelTable.id },
    { name: "mealPlan",        fieldType: "Short Text", isPrimaryKey: false, isRequired: true,  sortOrder: 5, tableId: hotelTable.id, fieldSize: 20 },
    { name: "pricePersonNight",fieldType: "Currency",   isPrimaryKey: false, isRequired: true,  sortOrder: 6, tableId: hotelTable.id },
  ]).returning();
  const hotelRefField  = hotelFieldRows[0];
  const hotelResortIdField = hotelFieldRows[2];

  const hotelRecords = [
    { hotelRef: "AY01", hotelName: "Cliff Top",                    resortID: "R1", starRating: 3, swimmingPool: true,  mealPlan: "Half Board",    pricePersonNight: 58.99  },
    { hotelRef: "AY02", hotelName: "Turnberry Sands",              resortID: "R1", starRating: 5, swimmingPool: true,  mealPlan: "Full Board",    pricePersonNight: 199.99 },
    { hotelRef: "AY03", hotelName: "Ayrshire View",                resortID: "R1", starRating: 2, swimmingPool: false, mealPlan: "Self Catering", pricePersonNight: 42.00  },
    { hotelRef: "FW01", hotelName: "Ben Nevis Country House",      resortID: "R2", starRating: 4, swimmingPool: false, mealPlan: "B&B",           pricePersonNight: 126.00 },
    { hotelRef: "FW02", hotelName: "Fort William Lodge",           resortID: "R2", starRating: 3, swimmingPool: false, mealPlan: "Half Board",    pricePersonNight: 72.50  },
    { hotelRef: "FW03", hotelName: "Fort William Grand",           resortID: "R2", starRating: 4, swimmingPool: true,  mealPlan: "B&B",           pricePersonNight: 118.00 },
    { hotelRef: "ST01", hotelName: "Lochside Heather Retreat",     resortID: "R3", starRating: 5, swimmingPool: true,  mealPlan: "B&B",           pricePersonNight: 172.00 },
    { hotelRef: "ST02", hotelName: "Old Course View",              resortID: "R3", starRating: 4, swimmingPool: true,  mealPlan: "Half Board",    pricePersonNight: 145.00 },
    { hotelRef: "ST03", hotelName: "St Andrews Bay Hotel",         resortID: "R3", starRating: 3, swimmingPool: false, mealPlan: "Self Catering", pricePersonNight: 65.00  },
    { hotelRef: "IN01", hotelName: "Highland Lodge",               resortID: "R4", starRating: 3, swimmingPool: false, mealPlan: "Self Catering", pricePersonNight: 68.00  },
    { hotelRef: "IN02", hotelName: "Inverness Castle View",        resortID: "R4", starRating: 4, swimmingPool: false, mealPlan: "B&B",           pricePersonNight: 92.00  },
    { hotelRef: "ED01", hotelName: "Edinburgh Grand",              resortID: "R5", starRating: 5, swimmingPool: true,  mealPlan: "Room Only",     pricePersonNight: 220.00 },
    { hotelRef: "ED02", hotelName: "Edinburgh City Stay",          resortID: "R5", starRating: 3, swimmingPool: false, mealPlan: "B&B",           pricePersonNight: 88.00  },
    { hotelRef: "AV01", hotelName: "Cairngorm Hotel",              resortID: "R6", starRating: 3, swimmingPool: false, mealPlan: "Half Board",    pricePersonNight: 78.00  },
    { hotelRef: "AV02", hotelName: "Aviemore Mountain Resort",     resortID: "R6", starRating: 4, swimmingPool: true,  mealPlan: "Half Board",    pricePersonNight: 132.00 },
    { hotelRef: "OB01", hotelName: "Oban Bay Resort",              resortID: "R7", starRating: 4, swimmingPool: true,  mealPlan: "B&B",           pricePersonNight: 110.00 },
    { hotelRef: "AB01", hotelName: "Aberfeldy Arms",               resortID: "R8", starRating: 2, swimmingPool: false, mealPlan: "Self Catering", pricePersonNight: 38.00  },
    { hotelRef: "AN01", hotelName: "Anstruther Harbour Inn",       resortID: "R9", starRating: 3, swimmingPool: false, mealPlan: "B&B",           pricePersonNight: 75.00  },
    { hotelRef: "AN02", hotelName: "Anstruther Seaview",           resortID: "R9", starRating: 4, swimmingPool: true,  mealPlan: "Half Board",    pricePersonNight: 115.00 },
  ];
  await db!.insert(dsRecords).values(hotelRecords.map(r => ({ tableId: hotelTable.id, databaseId: database.id, data: r })));
  console.log("Hotel table seeded.");

  /* ── Customer table ── */
  const [customerTable] = await db!.insert(dsTables).values({ name: "Customer", databaseId: database.id }).returning();
  const customerFieldRows = await db!.insert(dsFields).values([
    { name: "customerID", fieldType: "Short Text", isPrimaryKey: true,  isRequired: true,  sortOrder: 0, tableId: customerTable.id, fieldSize: 10 },
    { name: "firstName",  fieldType: "Short Text", isPrimaryKey: false, isRequired: true,  sortOrder: 1, tableId: customerTable.id, fieldSize: 40 },
    { name: "surname",    fieldType: "Short Text", isPrimaryKey: false, isRequired: true,  sortOrder: 2, tableId: customerTable.id, fieldSize: 40 },
    { name: "address",    fieldType: "Short Text", isPrimaryKey: false, isRequired: false, sortOrder: 3, tableId: customerTable.id, fieldSize: 100 },
    { name: "postcode",   fieldType: "Short Text", isPrimaryKey: false, isRequired: false, sortOrder: 4, tableId: customerTable.id, fieldSize: 10 },
  ]).returning();
  const customerIdField = customerFieldRows[0];

  const customerRecords = [
    { customerID: "C001", firstName: "Omar",     surname: "Shaheed",   address: "12 Glen Road",        postcode: "FK1 1AA" },
    { customerID: "C002", firstName: "Fiona",    surname: "Thomson",   address: "45 Castle Street",    postcode: "EH1 2AB" },
    { customerID: "C003", firstName: "James",    surname: "Dhu",       address: "7 Shore Road",        postcode: "KA7 2CD" },
    { customerID: "C004", firstName: "Philippa", surname: "Christie",  address: "18 Park Avenue",      postcode: "IV2 3EF" },
    { customerID: "C005", firstName: "Rachel",   surname: "Sharma",    address: "3 Millburn Road",     postcode: "IV2 3GH" },
    { customerID: "C006", firstName: "Brian",    surname: "Hughes",    address: "91 High Street",      postcode: "KY16 9JK" },
    { customerID: "C007", firstName: "Laura",    surname: "Bhatt",     address: "22 West Nile Street", postcode: "G1 2LM" },
    { customerID: "C008", firstName: "Stuart",   surname: "Chalmer",   address: "5 Victoria Road",     postcode: "AB10 1NO" },
    { customerID: "C009", firstName: "Margaret", surname: "Whitfield", address: "67 Queen Street",     postcode: "EH2 4PQ" },
    { customerID: "C010", firstName: "Tom",      surname: "Whyte",     address: "34 Loch Road",        postcode: "PH16 5RS" },
    { customerID: "C011", firstName: "Elaine",   surname: "Blackwood", address: "14 Thistle Lane",     postcode: "ML1 1TU" },
    { customerID: "C012", firstName: "Colin",    surname: "Charles",   address: "8 River View",        postcode: "PA1 2VW" },
    { customerID: "C013", firstName: "Susan",    surname: "Phair",     address: "30 Briar Road",       postcode: "KA1 3XY" },
    { customerID: "C014", firstName: "Gordon",   surname: "Thom",      address: "11 Bridge Street",    postcode: "DD1 4ZA" },
    { customerID: "C015", firstName: "Anya",     surname: "Pringle",   address: "55 Harbour Row",      postcode: "KY10 3BC" },
    { customerID: "C016", firstName: "Neil",     surname: "Sharma",    address: "2 Elm Drive",         postcode: "G12 8DE" },
  ];
  await db!.insert(dsRecords).values(customerRecords.map(r => ({ tableId: customerTable.id, databaseId: database.id, data: r })));
  console.log("Customer table seeded.");

  /* ── Booking table ── */
  const [bookingTable] = await db!.insert(dsTables).values({ name: "Booking", databaseId: database.id }).returning();
  const bookingFieldRows = await db!.insert(dsFields).values([
    { name: "bookingNo",    fieldType: "Number",     isPrimaryKey: true,  isRequired: true,  sortOrder: 0, tableId: bookingTable.id },
    { name: "customerID",   fieldType: "Short Text", isPrimaryKey: false, isRequired: true,  sortOrder: 1, tableId: bookingTable.id, fieldSize: 10 },
    { name: "hotelRef",     fieldType: "Short Text", isPrimaryKey: false, isRequired: true,  sortOrder: 2, tableId: bookingTable.id, fieldSize: 10 },
    { name: "startDate",    fieldType: "Short Text", isPrimaryKey: false, isRequired: true,  sortOrder: 3, tableId: bookingTable.id, fieldSize: 12 },
    { name: "numberNights", fieldType: "Number",     isPrimaryKey: false, isRequired: true,  sortOrder: 4, tableId: bookingTable.id },
    { name: "numberPeople", fieldType: "Number",     isPrimaryKey: false, isRequired: true,  sortOrder: 5, tableId: bookingTable.id },
    { name: "numberInParty",fieldType: "Number",     isPrimaryKey: false, isRequired: true,  sortOrder: 6, tableId: bookingTable.id },
  ]).returning();
  const bookingNoField  = bookingFieldRows[0];
  const bookingCustIdField = bookingFieldRows[1];
  const bookingHotelRefField = bookingFieldRows[2];

  const bookingRecords = [
    { bookingNo: 134, customerID: "C001", hotelRef: "AY01", startDate: "15/06/2024", numberNights: 7,  numberPeople: 2, numberInParty: 2 },
    { bookingNo: 135, customerID: "C002", hotelRef: "ST01", startDate: "03/07/2024", numberNights: 5,  numberPeople: 1, numberInParty: 1 },
    { bookingNo: 136, customerID: "C003", hotelRef: "FW01", startDate: "12/07/2024", numberNights: 6,  numberPeople: 3, numberInParty: 3 },
    { bookingNo: 137, customerID: "C004", hotelRef: "IN01", startDate: "20/07/2024", numberNights: 4,  numberPeople: 2, numberInParty: 2 },
    { bookingNo: 138, customerID: "C005", hotelRef: "AV01", startDate: "01/08/2024", numberNights: 7,  numberPeople: 4, numberInParty: 4 },
    { bookingNo: 139, customerID: "C006", hotelRef: "ST02", startDate: "08/07/2024", numberNights: 3,  numberPeople: 2, numberInParty: 2 },
    { bookingNo: 140, customerID: "C007", hotelRef: "ED01", startDate: "22/06/2024", numberNights: 2,  numberPeople: 1, numberInParty: 1 },
    { bookingNo: 141, customerID: "C008", hotelRef: "OB01", startDate: "15/07/2024", numberNights: 5,  numberPeople: 4, numberInParty: 4 },
    { bookingNo: 142, customerID: "C009", hotelRef: "AY02", startDate: "01/07/2024", numberNights: 7,  numberPeople: 2, numberInParty: 2 },
    { bookingNo: 143, customerID: "C010", hotelRef: "FW02", startDate: "10/09/2024", numberNights: 5,  numberPeople: 3, numberInParty: 3 },
    { bookingNo: 144, customerID: "C011", hotelRef: "IN02", startDate: "25/07/2024", numberNights: 6,  numberPeople: 2, numberInParty: 2 },
    { bookingNo: 145, customerID: "C012", hotelRef: "AV02", startDate: "14/08/2024", numberNights: 7,  numberPeople: 5, numberInParty: 4 },
    { bookingNo: 146, customerID: "C013", hotelRef: "ST03", startDate: "05/07/2024", numberNights: 4,  numberPeople: 2, numberInParty: 2 },
    { bookingNo: 147, customerID: "C014", hotelRef: "AN01", startDate: "30/06/2024", numberNights: 3,  numberPeople: 2, numberInParty: 2 },
    { bookingNo: 148, customerID: "C015", hotelRef: "AN02", startDate: "18/07/2024", numberNights: 5,  numberPeople: 4, numberInParty: 4 },
    { bookingNo: 149, customerID: "C001", hotelRef: "ST01", startDate: "22/07/2024", numberNights: 7,  numberPeople: 2, numberInParty: 2 },
    { bookingNo: 150, customerID: "C002", hotelRef: "AY03", startDate: "05/09/2024", numberNights: 4,  numberPeople: 3, numberInParty: 3 },
    { bookingNo: 151, customerID: "C016", hotelRef: "ED02", startDate: "12/10/2024", numberNights: 2,  numberPeople: 1, numberInParty: 1 },
    { bookingNo: 152, customerID: "C003", hotelRef: "AV01", startDate: "09/07/2024", numberNights: 6,  numberPeople: 2, numberInParty: 2 },
    { bookingNo: 153, customerID: "C006", hotelRef: "FW03", startDate: "20/08/2024", numberNights: 5,  numberPeople: 2, numberInParty: 2 },
    { bookingNo: 154, customerID: "C007", hotelRef: "OB01", startDate: "28/07/2024", numberNights: 3,  numberPeople: 2, numberInParty: 2 },
    { bookingNo: 155, customerID: "C004", hotelRef: "AY01", startDate: "04/07/2024", numberNights: 5,  numberPeople: 3, numberInParty: 3 },
    { bookingNo: 156, customerID: "C009", hotelRef: "IN02", startDate: "08/08/2024", numberNights: 4,  numberPeople: 2, numberInParty: 2 },
    { bookingNo: 157, customerID: "C012", hotelRef: "AB01", startDate: "14/07/2024", numberNights: 7,  numberPeople: 4, numberInParty: 4 },
    { bookingNo: 158, customerID: "C014", hotelRef: "ST02", startDate: "30/07/2024", numberNights: 3,  numberPeople: 1, numberInParty: 1 },
    { bookingNo: 159, customerID: "C005", hotelRef: "ED01", startDate: "15/11/2024", numberNights: 2,  numberPeople: 2, numberInParty: 2 },
    { bookingNo: 160, customerID: "C011", hotelRef: "AN01", startDate: "07/07/2024", numberNights: 4,  numberPeople: 3, numberInParty: 3 },
  ];
  await db!.insert(dsRecords).values(bookingRecords.map(r => ({ tableId: bookingTable.id, databaseId: database.id, data: r })));
  console.log("Booking table seeded.");

  /* ── Relationships (use field IDs) ── */
  await db!.insert(dsRelationships).values([
    {
      databaseId: database.id,
      fromTableId: hotelTable.id,
      fromFieldId: hotelResortIdField.id,
      toTableId: resortTable.id,
      toFieldId: resortIdField.id,
      relationshipType: "many-to-one",
    },
    {
      databaseId: database.id,
      fromTableId: bookingTable.id,
      fromFieldId: bookingCustIdField.id,
      toTableId: customerTable.id,
      toFieldId: customerIdField.id,
      relationshipType: "many-to-one",
    },
    {
      databaseId: database.id,
      fromTableId: bookingTable.id,
      fromFieldId: bookingHotelRefField.id,
      toTableId: hotelTable.id,
      toFieldId: hotelRefField.id,
      relationshipType: "many-to-one",
    },
  ]);
  console.log("Relationships set.");

  /* ── Embed token ── */
  const token = crypto.randomBytes(16).toString("hex");
  await db!.insert(dsEmbeds).values({
    token,
    databaseId: database.id,
    userId: "teacher_system",
  });
  console.log("\n✅ Done!");
  console.log("Embed token:", token);
  console.log("\nIframe code:");
  console.log(`<iframe src="/data-sculptor/?embed=${token}&mode=sql" width="100%" height="780" frameborder="0" style="border: 1px solid #ccc; border-radius: 6px; display: block; margin: 16px 0;"></iframe>`);
}

main().catch(e => { console.error(e); process.exit(1); }).then(() => process.exit(0));
