/**
 * seed.js
 * Populates the local MongoDB with ~100 mock documents per collection.
 * Run with: node seed.js
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Holiday from "./models/Holiday.js";
import Favourite from "./models/Favourite.js";
import Suggestion from "./models/Suggestion.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/holidaysDB";

const firstNames = ["Alice","Bob","Carlos","Diana","Emily","Fiona","George","Hannah","Ivan","Julia","Kevin","Laura","Marco","Nina","Oscar","Paula","Quinn","Rafael","Sara","Tom","Uma","Victor","Wendy","Xena","Yusuf","Zara","Liam","Mia","Noah","Olivia","Pedro","Rita","Sam","Tina","Umar","Vera","Will","Xia","Yasmin","Zoe","Aaron","Bella","Chris","Dana","Eli","Faith","Grant","Holly","Ian","Jade"];
const lastNames = ["Smith","Jones","Williams","Brown","Taylor","Davies","Evans","Wilson","Thomas","Roberts","Johnson","Lee","Walker","Hall","Allen","Young","Hernandez","King","Wright","Lopez","Hill","Scott","Green","Adams","Baker","Nelson","Carter","Mitchell","Perez","Campbell","Anderson","Jackson","White","Harris","Martin","Thompson","Garcia","Martinez","Robinson","Clark"];
const countries = ["Ireland","Brazil","Japan","Germany","India","Nigeria","Australia","Canada","Mexico","France","Spain","Italy","Portugal","Egypt","South Africa","China","USA","UK","Argentina","Colombia","Peru","Chile","Kenya","Morocco","Turkey","Poland","Sweden","Norway","Denmark","Netherlands","Belgium","Switzerland","Austria","Greece","Hungary","Czech Republic","Romania","Ukraine","Russia","South Korea","Vietnam","Thailand","Indonesia","Malaysia","Philippines","New Zealand","Ghana","Ethiopia","Tanzania","Senegal"];
const categories = ["Public","Religious","Cultural","National","Other","Seasonal","International","Unknown"];
const suggestionStatuses = ["pending","approved","rejected"];
const holidayNames = ["New Year's Day","Easter Monday","Christmas Day","Independence Day","Labour Day","National Day","Republic Day","Liberation Day","Constitution Day","Remembrance Day","Carnival","Midsummer Festival","Harvest Festival","Spring Festival","Winter Solstice","Summer Solstice","Eid al-Fitr","Eid al-Adha","Diwali","Hanukkah","Chinese New Year","Lunar New Year","Day of the Dead","St Patrick's Day","Valentine's Day","Mother's Day","Father's Day","Halloween","Thanksgiving","Holi","Nowruz","Vesak","Guru Nanak Jayanti","Obon Festival","Cherry Blossom Festival","Bastille Day","Guy Fawkes Night","Anzac Day","Canada Day","Columbus Day","Martin Luther King Day","Presidents Day","Veterans Day","Memorial Day","Flag Day","Citizenship Day","Armistice Day","Victory Day","Revolution Day","Foundation Day","National Heroes Day","Youth Day","Environment Day","Peace Day","Human Rights Day","Solidarity Day","Workers Day","Farmers Day","Teachers Day","Childrens Day","Womens Day","Mens Day","Family Day","Culture Day","Sports Day","Science Day","Arts Day","Music Day","Film Day","Literature Day","Health Day","Education Day","Freedom Day","Equality Day","Unity Day","Heritage Day","Reconciliation Day","Democracy Day","Parliament Day","Constitution Day 2","Sovereignty Day","Sea Day","Mountain Day","Forest Day","Water Day","Air Day","Fire Festival","Lantern Festival","Dragon Boat Festival","Moon Festival","Snow Festival","Flower Festival","Sun Festival","Rain Festival","Wind Festival","Earth Day","Ocean Day","Wildlife Day","Nature Day","Green Day","Blue Day","Red Day","Gold Day","Silver Day","Diamond Jubilee"];
const descriptions = ["A public holiday celebrated nationwide.","Marks the beginning of a new year.","A religious observance with deep cultural roots.","Commemorates a historic national event.","Celebrates the harvest season.","A festival of lights and joy.","Honors the country's founding.","Remembers those who gave their lives.","A day of cultural pride and tradition.","Celebrates the arrival of spring.","A solemn day of reflection.","A joyful community celebration.","Marks the end of the fasting period.","A winter festival with ancient origins.","Celebrates unity and solidarity.","A national day of thanksgiving.","Honors the legacy of a great leader.","A day for environmental awareness.","Celebrates the arts and culture.","A festival enjoyed by all ages."];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randDate = (year) => {
  const month = randInt(1, 12);
  const day = randInt(1, 28);
  return new Date(year, month - 1, day);
};

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB:", MONGO_URI);

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Holiday.deleteMany({}),
    Favourite.deleteMany({}),
    Suggestion.deleteMany({}),
  ]);
  console.log("Cleared existing data.");

  // --- Users (100) ---
  const passwordHash = await bcrypt.hash("Password123!", 10);
  const userData = Array.from({ length: 100 }, (_, i) => ({
    firstName: firstNames[i % firstNames.length],
    lastName: lastNames[i % lastNames.length],
    email: `user${i + 1}@seedtest.com`,
    phone: `+353${String(800000000 + i).padStart(9, "0")}`,
    role: i === 0 ? "admin" : "user",
    passwordHash,
    preferredCountry: rand(countries),
    preferredMonth: randInt(1, 12),
  }));
  const users = await User.insertMany(userData);
  console.log(`Inserted ${users.length} users. (user1@seedtest.com is admin, all passwords: Password123!)`);

  // --- Holidays (100) ---
  const holidayData = Array.from({ length: 100 }, (_, i) => {
    const date = randDate(2025);
    return {
      name: holidayNames[i % holidayNames.length],
      country: rand(countries),
      date,
      month: date.getMonth() + 1,
      category: rand(categories),
      description: rand(descriptions),
    };
  });
  const holidays = await Holiday.insertMany(holidayData);
  console.log(`Inserted ${holidays.length} holidays.`);

  // --- Favourites (100, unique user+holiday pairs) ---
  const usedPairs = new Set();
  const favouriteData = [];
  let attempts = 0;
  while (favouriteData.length < 100 && attempts < 5000) {
    attempts++;
    const user = rand(users)._id;
    const holiday = rand(holidays)._id;
    const key = `${user}-${holiday}`;
    if (!usedPairs.has(key)) {
      usedPairs.add(key);
      favouriteData.push({ user, holiday });
    }
  }
  const favourites = await Favourite.insertMany(favouriteData);
  console.log(`Inserted ${favourites.length} favourites.`);

  // --- Suggestions (100) ---
  const suggestionData = Array.from({ length: 100 }, (_, i) => ({
    submittedBy: users[i % users.length]._id,
    name: holidayNames[(i + 10) % holidayNames.length],
    country: rand(countries),
    date: randDate(2026),
    category: rand(categories.filter(c => c !== "All" && c !== "None")),
    description: rand(descriptions),
    referenceLink: `https://en.wikipedia.org/wiki/Holiday_${i + 1}`,
    status: rand(suggestionStatuses),
  }));
  const suggestions = await Suggestion.insertMany(suggestionData);
  console.log(`Inserted ${suggestions.length} suggestions.`);

  console.log("\nSeed complete.");
  console.log("Login with any seeded user: email=user1@seedtest.com (admin), user2@seedtest.com, ... password=Password123!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  mongoose.disconnect();
  process.exit(1);
});
