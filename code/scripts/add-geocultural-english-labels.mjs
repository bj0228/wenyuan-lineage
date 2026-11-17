/** Add reproducible romanized fallbacks for CBDB long-tail names in the English map. */
import fs from "node:fs";
import { pinyin } from "pinyin-pro";

const path = new URL("../public/data/geocultural-index.json", import.meta.url);
const data = JSON.parse(fs.readFileSync(path, "utf8"));

const romanize = (value) => pinyin(String(value || ""), {
  toneType: "none",
  type: "array",
  nonZh: "consecutive",
}).join(" ")
  .replace(/\s*([:：,，;；()（）/／])\s*/g, "$1 ")
  .replace(/\s+/g, " ")
  .trim()
  .replace(/(^|[\s(/])([a-z])/g, (_, lead, letter) => `${lead}${letter.toUpperCase()}`);

const addPerson = (person) => ({
  ...person,
  nameEn: romanize(person.name),
  worksEn: (person.works || []).map(romanize),
});
const addBook = (book) => ({
  ...book,
  titleEn: romanize(book.title),
  authorEn: romanize(book.author),
  ...(book.locationPerson ? { locationPersonEn: romanize(book.locationPerson) } : {}),
});

data.places = data.places.map((place) => ({
  ...place,
  nameEn: romanize(place.name),
  people: place.people.map(addPerson),
  books: place.books.map(addBook),
}));
data.unresolved.people = data.unresolved.people.map(addPerson);
data.unresolved.books = data.unresolved.books.map(addBook);

fs.writeFileSync(path, JSON.stringify(data));
console.log(JSON.stringify({ places: data.places.length, people: data.summary.activePeople, books: data.summary.chineseBooks }, null, 2));
