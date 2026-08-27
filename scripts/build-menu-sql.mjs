import { writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUMP = 2;
const p = (n) => (n == null || n === "" ? null : Number((Number(n) + BUMP).toFixed(1)));
const sqlNum = (n) => (n == null ? "null" : String(n));

const cats = [
  ["foul", "Foul Sandwiches", "سندوتشات الفول", false, 1],
  ["taameya", "Falafel Sandwiches", "سندوتشات الطعمية", false, 2],
  ["oriental", "Oriental Sandwiches", "سندوتشات الشرقي", false, 3],
  ["omelet", "Omelet Sandwiches", "سندوتشات الأومليت", false, 4],
  ["omelet_plates", "Omelet Plates", "طلبات الأومليت", true, 5],
  ["meat", "Meat Sandwiches", "سندوتشات اللحوم", false, 6],
  ["green", "Green Burger Taameya", "جرين برجر طعمية", false, 7],
  ["rolls", "Roll Sandwiches", "سندوتشات الرول", false, 8],
  ["fries", "Pomme Frites Sandwiches", "سندوتشات بوم فريت", false, 9],
  ["apps", "Appetizers", "المقبلات", false, 10],
  ["misc", "Assorted", "منوع", false, 11],
  ["boxes", "Boxes", "العلب", true, 12],
];

/** bread: [fino, balady, shami] printed prices */
const bread = [
  // foul
  ["foul-plain", "foul", "Foul", "فول", 13, 12, 12, 1],
  ["foul-hot", "foul", "Foul Hot Oil", "فول زيت حار", 13, 12, 12, 2],
  ["foul-olive", "foul", "Foul Olive Oil", "فول زيت زيتون", 15, 13, 13, 3],
  ["foul-butter", "foul", "Foul Butter", "فول زبدة", 15, 13, 13, 4],
  ["foul-alex", "foul", "Foul Alexandrian", "فول اسكندراني", 15, 13, 13, 5],
  ["foul-lemon", "foul", "Foul Preserved Lemon", "فول ليمون معصفر", 15, 13, 13, 6],
  ["foul-sug", "foul", "Foul Sausage", "فول بالسجق", 20, 18, 18, 7],
  ["foul-egg", "foul", "Foul Boiled Egg", "فول بالبيض المسلوق", 20, 18, 18, 8],
  ["foul-omelet", "foul", "Foul Omelet", "فول بالبيض الأومليت", 20, 18, 18, 9],
  ["foul-baba", "foul", "Foul Baba Ghanoush", "فول على بابا غنوج", 15, 13, 13, 10],
  ["foul-mesa", "foul", "Foul Moussaka", "فول على مسقعة", 16, 14, 14, 11],
  ["foul-potato", "foul", "Foul Potato", "فول على بطاطس", 17, 15, 15, 12],
  ["foul-salad", "foul", "Foul Salad", "فول على سلطة", 15, 14, 14, 13],
  ["foul-bastr", "foul", "Foul Pastrami", "فول بسطرمة", 22, 20, 20, 14],
  ["foul-eggpl", "foul", "Foul Eggplant", "فول على باذنجان", 15, 14, 14, 15],

  // taameya
  ["tam-plain", "taameya", "Falafel", "طعمية", 13, 12, 12, 1],
  ["tam-stuffed", "taameya", "Stuffed Falafel", "طعمية محشية", 15, 15, 15, 2],
  ["tam-chick", "taameya", "Falafel Egg Inside", "طعمية عين كتكوت", 20, 18, 18, 3],
  ["tam-omelet", "taameya", "Falafel Omelet", "طعمية على أومليت", 20, 18, 18, 4],
  ["tam-egg", "taameya", "Falafel Boiled Egg", "طعمية بالبيض المسلوق", 20, 18, 18, 5],
  ["tam-pickled-eggpl", "taameya", "Falafel Pickled Eggplant", "طعمية بالباذنجان المخلل", 18, 16, 16, 6],
  ["tam-baba", "taameya", "Falafel Baba Ghanoush", "طعمية على بابا غنوج", 17, 17, 17, 7],
  ["tam-white", "taameya", "Falafel White Cheese", "طعمية على جبنة بيضاء", 19, 17, 17, 8],
  ["tam-old", "taameya", "Falafel Old Cheese", "طعمية على جبنة قديمة", 19, 17, 17, 9],
  ["tam-roumi", "taameya", "Falafel Roumi", "طعمية على جبنة رومي", 21, 19, 19, 10],
  ["tam-ched", "taameya", "Falafel Cheddar", "طعمية على جبنة شيدر", 21, 19, 19, 11],
  ["tam-mozz", "taameya", "Falafel Mozzarella", "طعمية على جبنة موتزاريلا", 21, 19, 19, 12],
  ["tam-mix", "taameya", "Falafel Mix Cheese", "طعمية مكس جبن", 24, 22, 22, 13],
  ["tam-sug", "taameya", "Falafel Sausage", "طعمية على سجق", 24, 22, 22, 14],
  ["tam-bastr", "taameya", "Falafel Pastrami", "طعمية بالبسطرمة", 24, 22, 22, 15],
  ["tam-lemon", "taameya", "Falafel Preserved Lemon", "طعمية على ليمون معصفر", 17, 15, 15, 16],
  ["tam-spicy", "taameya", "Spicy Falafel Harissa", "طعمية مشطشطة بالهريسة", 20, 18, 18, 17],
  ["tam-kiri", "taameya", "Falafel Kiri", "طعمية جبنة كيري", 22, 22, 22, 18],
  ["tam-saus", "taameya", "Falafel Hot Dog", "طعمية على سوسيس", 22, 22, 22, 19],
  ["tam-fried-mix", "taameya", "Falafel Fried Mix", "طعمية ميكس مقليات", 22, 22, 22, 20],
  ["tam-eggpl", "taameya", "Falafel Fried Eggplant", "طعمية على باذنجان مقلي", 16, 16, 16, 21],
  ["tam-special", "taameya", "Special Falafel", "طعمية مخصوص", 15, 15, 15, 22],

  // oriental
  ["ori-mesa", "oriental", "Moussaka", "مسقعة", 17, 15, 15, 1],
  ["ori-baba", "oriental", "Baba Ghanoush", "بابا غنوج", 17, 15, 15, 2],
  ["ori-eggpl", "oriental", "Fried Eggplant", "باذنجان مقلي", 17, 15, 15, 3],
  ["ori-old", "oriental", "Old Cheese", "جبنة قديمة", 17, 15, 15, 4],
  ["ori-white", "oriental", "White Cheese", "جبنة بيضاء", 17, 15, 15, 5],
  ["ori-tomato", "oriental", "Cheese Tomato Cucumber Olive", "جبنة بالطماطم والخيار وزيت الزيتون", 20, 18, 18, 6],
  ["ori-fries", "oriental", "Fried Potatoes", "بطاطس محمرة", 17, 15, 15, 7],
  ["ori-pomme", "oriental", "Pomme Frites", "بطاطس بوم فريت", 24, 22, 22, 8],
  ["ori-chips", "oriental", "Chips", "بطاطس شيبسي", 17, 15, 15, 9],
  ["ori-mash", "oriental", "Mashed Potatoes", "بطاطس مهروسة", 17, 15, 15, 10],
  ["ori-mash-egg", "oriental", "Mashed with Egg", "بطاطس مهروسة بالبيض", 25, 25, 25, 11],
  ["ori-mash-omelet", "oriental", "Mashed Fried Egg", "بطاطس مهروسة ببيض مقلي", 25, 25, 25, 17],
  ["ori-mash-bastr", "oriental", "Mashed with Pastrami", "بطاطس مهروسة بالبسطرمة", 32, 30, 30, 12],
  ["ori-pomme-roumi", "oriental", "Fries Roumi Olive", "بطاطس بوم فريت بالرومي والزيتون", 32, 30, 30, 13],
  ["ori-dynamite", "oriental", "Dynamite Mix", "ديناميت", 27, 25, 25, 14],
  ["ori-shak", "oriental", "Shakshouka", "شكشوكة", 17, 15, 15, 15],
  ["ori-thyme", "oriental", "Cheese Thyme Olive Oil", "جبنة بالزعتر وزيت الزيتون", 18, 16, 16, 16],

  // omelet sandwiches
  ["om-plain", "omelet", "Plain Omelet", "أومليت سادة", 19, 17, 17, 1],
  ["om-bastr", "omelet", "Omelet Pastrami", "أومليت بالبسطرمة", 25, 23, 23, 2],
  ["om-sug", "omelet", "Omelet Sausage", "أومليت بالسجق", 25, 23, 23, 3],
  ["om-pizza", "omelet", "Omelet Pizza", "أومليت بيتزا", 25, 23, 23, 4],
  ["om-kiri", "omelet", "Omelet Kiri", "أومليت كيري", 25, 23, 23, 5],
  ["om-roumi", "omelet", "Omelet Roumi", "أومليت رومي", 28, 26, 26, 6],
  ["om-ched", "omelet", "Omelet Cheddar", "أومليت شيدر", 28, 26, 26, 7],
  ["om-mozz", "omelet", "Omelet Mozzarella", "أومليت موتزاريلا", 28, 26, 26, 8],
  ["om-mix", "omelet", "Omelet Mix Cheese", "أومليت مكس جبن", 30, 28, 28, 9],
  ["om-boiled", "omelet", "Boiled Egg Sandwich", "بيض مسلوق", 18, 16, 16, 10],
  ["om-roll", "omelet", "Egg Rolled in Butter", "بيض دحروجة في الزبدة", 22, 20, 20, 11],
  ["om-veg", "omelet", "Vegetable Omelet", "أومليت خضروات", 21, 19, 19, 12],
  ["om-saus", "omelet", "Omelet Hot Dog", "أومليت سوسيس", 25, 23, 23, 13],

  // green burger: shami / balady (no fino on the card)
  ["green-plain", "green", "Plain Green Burger", "جرين برجر سادة", null, 18, 15, 1],
  ["green-stuffed", "green", "Stuffed Green Burger", "جرين برجر محشية", null, 20, 18, 2],
  ["green-bastr", "green", "Green Burger Pastrami", "جرين برجر بسطرمة", null, 22, 20, 3],
  ["green-mix", "green", "Green Burger Mix Cheese", "جرين برجر ميكس جبن", null, 24, 22, 4],
  ["green-kiri", "green", "Green Burger Kiri", "جرين برجر جبنة كيري", null, 21, 19, 5],
  ["green-egg", "green", "Green Burger Egg", "جرين برجر بيض", null, 22, 20, 6],
  ["green-egg-cheese", "green", "Green Burger Egg & Cheese", "جرين برجر بيض و جبنة", null, 26, 26, 7],

  // fries sandwiches: shami | fino
  ["fr-plain", "fries", "Pomme Frites", "بوم فريت", 19, null, 18, 1],
  ["fr-ketch", "fries", "Fries Ketchup", "بوم فريت كاتشب", 20, null, 19, 2],
  ["fr-mayo", "fries", "Fries Mayo", "بوم فريت مايونيز", 20, null, 19, 3],
  ["fr-ketch-mayo", "fries", "Fries Ketchup Mayo", "بوم فريت كاتشب مايونيز", 21, null, 20, 4],
  ["fr-egg", "fries", "Fries Boiled Egg", "بوم فريت على بيض مسلوق", 24, null, 22, 5],
  ["fr-omelet", "fries", "Fries Omelet", "بوم فريت على أومليت", 24, null, 22, 6],
  ["fr-white", "fries", "Fries White Cheese", "بوم فريت على جبنة بيضاء", 24, null, 22, 7],
  ["fr-roumi", "fries", "Fries Roumi", "بوم فريت على جبنة رومي", 24, null, 22, 8],
  ["fr-ched", "fries", "Fries Cheddar", "بوم فريت على جبنة شيدر", 24, null, 22, 9],
  ["fr-mozz", "fries", "Fries Mozzarella", "بوم فريت على جبنة موتزاريلا", 26, null, 24, 10],
  ["fr-mix", "fries", "Fries Mix Cheese", "بوم فريت على ميكس جبن", 24, null, 22, 11],
  ["fr-feta", "fries", "Fries Feta", "بوم فريت على جبنة فيتا", 21, null, 19, 12],
  ["fr-qarish", "fries", "Fries Cottage Cheese", "بوم فريت على جبنة قريش", 21, null, 19, 13],
  ["fr-baba", "fries", "Fries Baba Ghanoush", "بوم فريت على بابا غنوج", 21, null, 19, 14],
  ["fr-eggpl", "fries", "Fries Fried Eggplant", "بوم فريت على باذنجان مقلي", 21, null, 19, 15],
  ["fr-pickled-eggpl", "fries", "Fries Pickled Eggplant", "بوم فريت على باذنجان مخلل", 21, null, 19, 16],
  ["fr-saus", "fries", "Fries Sausage", "بوم فريت على سوسيس", 30, null, 27, 17],
  ["fr-bazooka", "fries", "Bazooka", "بازوكا", 20, null, 18, 18],
  ["fr-chips", "fries", "Potato Chips", "بطاطس شيبسي", 20, null, 18, 19],
  ["fr-mash", "fries", "Mashed Potatoes", "بطاطس مهروسة", 20, null, 18, 20],
  ["fr-panne", "fries", "Potato Pané", "بطاطس بانيه", 28, null, 26, 21],
  ["fr-mash-butter", "fries", "Mashed with Butter", "مهروسة بالزبدة", 30, null, 27, 22],
  ["fr-mash-egg", "fries", "Mashed Boiled Egg", "مهروسة على بيض مسلوق", 21, null, 19, 23],
  ["fr-mash-omelet", "fries", "Mashed Omelet", "مهروسة على أومليت", 22, null, 20, 24],
  ["fr-mash-bastr", "fries", "Mashed Pastrami", "مهروسة على بسطرمة", 24, null, 22, 25],
  ["fr-chips-ketch", "fries", "Chips Ketchup", "شيبسي كاتشب", 24, null, 22, 26],
  ["fr-chips-mayo", "fries", "Chips Mayo", "شيبسي مايونيز", 25, null, 23, 27],
  ["fr-chips-mix", "fries", "Chips Ketchup Mayo", "شيبسي كاتشب و مايونيز", 21, null, 19, 28],
  ["fr-panne-mix", "fries", "Pané Ketchup Mayo", "بانيه كاتشب و مايونيز", 23, null, 21, 29],
];

/** each: printed single price → price_each */
const each = [
  ["meat-liver", "meat", "Liver", "كبدة", 30, 1],
  ["meat-sug", "meat", "Sausage", "سجق", 30, 2],
  ["meat-burger", "meat", "Plain Burger", "برجر سادة", 50, 3],
  ["meat-burger-egg", "meat", "Burger Egg", "برجر بيض", 60, 4],
  ["meat-burger-cheese", "meat", "Burger Cheese", "برجر جبنة", 65, 5],
  ["meat-burger-mix", "meat", "Mix Burger Egg & Cheese", "برجر ميكس بيض و جبنة", 70, 6],
  ["meat-hawawshi", "meat", "Hawawshi", "حواوشي", 50, 7],

  ["roll-foul", "rolls", "Foul Rockets Roll", "رول صواريخ ف.م", 30, 1],
  ["roll-tam", "rolls", "Taameya Rockets Roll", "رول صواريخ ت.ك", 30, 2],
  ["roll-potato", "rolls", "Potato Rockets Roll", "رول صواريخ بطاطس ك.م", 35, 3],
  ["roll-mix", "rolls", "Mix Cheese Rockets Roll", "رول صواريخ ميكس جبن", 40, 4],
  ["roll-mozz", "rolls", "Mozzarella Rockets Roll", "رول صواريخ موتزاريلا", 45, 5],
  ["roll-pepper", "rolls", "Pepper Mix Cheese Roll", "رول صواريخ فلفل ميكس جبن", 40, 6],
  ["roll-saus", "rolls", "Sausage Rockets Roll", "رول صواريخ سوسيس", 50, 7],
  ["roll-bastr", "rolls", "Pastrami Rockets Roll", "رول صواريخ بسطرمة", 55, 8],
  ["roll-sug", "rolls", "Sojouk Rockets Roll", "رول صواريخ سجق", 55, 9],
  ["roll-om-mix", "rolls", "Omelet Mix Cheese Roll", "رول أومليت ميكس جبن", 50, 10],
  ["roll-falafel-mix", "rolls", "Falafel Mix Cheese Roll", "رول فلافل ميكس جبن", 40, 11],
  ["roll-shabrawy", "rolls", "El Shabrawy Roll", "رول الشبراوي", 60, 12],
  ["roll-om-saus", "rolls", "Omelet Sausage Roll", "رول أومليت سوسيس", 50, 13],
  ["roll-liver", "rolls", "Liver Roll", "رول كبدة", 50, 14],

  ["app-lemon", "apps", "Preserved Lemon Box", "علبة ليمون معصفر", 10, 1],
  ["app-olives", "apps", "Pickled Olives Box", "علبة زيتون مخلل", 10, 2],
  ["app-cucumber", "apps", "Pickled Cucumber Box", "علبة خيار مخلل", 11, 3],
  ["app-mix-pickle", "apps", "Mixed Pickles Box", "علبة مخلل مشكل", 7, 4],
  ["app-tomato", "apps", "Pickled Tomatoes Box", "علبة طماطم مخلل", 10, 5],
  ["app-eggpl-pick", "apps", "Pickled Eggplant Box", "علبة باذنجان مخلل", 11, 6],
  ["app-eggpl-fried", "apps", "Fried Eggplant Box", "علبة باذنجان مقلي", 11, 7],
  ["app-salad", "apps", "Local Salad Box", "علبة سلطة بلدي", 11, 8],
  ["app-tahini", "apps", "Tahini Box", "علبة طحينة", 11, 9],
  ["app-pickles-plate", "apps", "Pickles Plate", "طبق طرشي", 16, 10],
  ["app-omelet", "apps", "Omelet Box", "علبة أومليت", 12, 11],
  ["app-pepper", "apps", "Fried Pepper Box", "علبة فلفل مقلي", 11, 12],
  ["app-toum", "apps", "Toumeya Box", "علبة ثومية", 16, 13],

  ["misc-disc", "misc", "Falafel Piece", "قرص طعمية", 3, 1],
  ["misc-disc-stuffed", "misc", "Stuffed Falafel Piece", "قرص طعمية محشية", 5, 2],
  ["misc-disc-chick", "misc", "Falafel Piece Egg Inside", "قرص طعمية عين كتكوت", 12, 3],
  ["misc-fries-pack", "misc", "Fries Packet", "باكيت بطاطس بوم فريت", 18, 4],
  ["misc-egg", "misc", "Boiled Egg", "بيضة مسلوقة", 10, 5],
  ["misc-shami-loaf", "misc", "Shami Loaf", "رغيف شامي", 1.5, 6],
  ["misc-balady-loaf", "misc", "Balady Loaf", "رغيف بلدي", 3.5, 7],
  ["misc-disc-roumi", "misc", "Falafel Piece Roumi", "قرص طعمية جبنة رومي", 12, 8],
  ["misc-disc-ched", "misc", "Falafel Piece Cheddar", "قرص طعمية جبنة شيدر", 12, 9],
  ["misc-disc-mozz", "misc", "Falafel Piece Mozzarella", "قرص طعمية جبنة موتزاريلا", 13, 10],
  ["misc-disc-mix", "misc", "Falafel Piece Mix Cheese", "قرص طعمية ميكس جبن", 15, 11],
];

/** plates: printed [2 eggs, 3 eggs] → sm, md */
const plates = [
  ["plt-plain", "omelet_plates", "Plain Omelet Plate", "أومليت سادة", 16, 24, 1],
  ["plt-special", "omelet_plates", "Special Omelet Plate", "أومليت استبيشال", 19, 26, 2],
  ["plt-bastr", "omelet_plates", "Pastrami Omelet Plate", "أومليت بسطرمة", 21, 28, 3],
  ["plt-sug", "omelet_plates", "Sausage Omelet Plate", "أومليت بالسجق", 21, 28, 4],
  ["plt-pizza", "omelet_plates", "Pizza Omelet Plate", "أومليت بيتزا", 23, 30, 5],
  ["plt-roumi", "omelet_plates", "Roumi Omelet Plate", "أومليت رومي", 23, 30, 6],
  ["plt-ched", "omelet_plates", "Cheddar Omelet Plate", "أومليت شيدر", 20, 27, 7],
  ["plt-mozz", "omelet_plates", "Mozzarella Omelet Plate", "أومليت موتزاريلا", 20, 27, 8],
  ["plt-mix", "omelet_plates", "Mix Cheese Omelet Plate", "أومليت مكس جبن", 24, 31, 9],
];

/** boxes: printed [sm, md, lg] */
const boxes = [
  ["box-plain", "boxes", "Plain Foul Box", "علبة فول سادة", 12, 22, 28, 1],
  ["box-alex", "boxes", "Alexandrian Foul Box", "علبة فول اسكندراني", 15, 26, 33, 2],
  ["box-olive", "boxes", "Olive Oil Foul Box", "علبة فول زيت زيتون", 16, 26, 33, 3],
  ["box-sug", "boxes", "Sausage Foul Box", "علبة فول بالسجق", 19, 29, 39, 4],
  ["box-mesa", "boxes", "Moussaka Box", "علبة مسقعة", 15, 24, 35, 5],
  ["box-baba", "boxes", "Baba Ghanoush Box", "علبة بابا غنوج", 15, 24, 34, 6],
  ["box-old", "boxes", "Old Cheese Box", "علبة جبنة قديمة", 15, 24, 34, 7],
  ["box-toum", "boxes", "Toumeya Box", "علبة تومية", null, 16, 24, 8],
  ["box-taameya", "boxes", "Falafel Dough Box", "علبة عجينة طعمية", null, 19, 25, 9],
  ["box-hotoil", "boxes", "Hot Oil Foul Box", "علبة فول زيت حار", 15, 25, 33, 10],
  ["box-lemon", "boxes", "Preserved Lemon Foul Box", "علبة فول ليمون معصفر", 16, 26, 34, 11],
  ["box-bastr", "boxes", "Pastrami Foul Box", "علبة فول بسطرمة", 19, 29, 39, 12],
  ["box-butter", "boxes", "Butter Foul Box", "علبة فول بالزبدة", 17, 26, 33, 13],
  ["box-mash", "boxes", "Mashed Box", "علبة مهروسة", 15, 20, 25, 14],
  ["box-mash-bastr", "boxes", "Mashed Pastrami Box", "علبة مهروسة بسطرمة", 20, 30, 40, 15],
  ["box-feta", "boxes", "Feta Box", "علبة جبنة فيتا", 15, 24, 34, 16],
  ["box-thyme", "boxes", "Thyme Cheese Box", "علبة جبنة زعتر وزيت زيتون", 17, 25, 35, 17],
];

const esc = (s) => String(s).replace(/'/g, "''");

const catSql = cats.map(([id, en, ar, tiered, sort]) =>
  `  ('${id}', '${esc(en)}', '${esc(ar)}', ${tiered}, ${sort})`
).join(",\n");

const breadRows = bread.map(([id, cat, en, ar, fino, balady, shami, sort]) =>
  `  ('${id}', '${cat}', '${esc(en)}', '${esc(ar)}', ${sqlNum(p(shami))}, ${sqlNum(p(balady))}, ${sqlNum(fino == null || fino === "" ? null : Number((Number(fino) + BUMP + BUMP).toFixed(1)))}, null, null, null, null, ${sort})`
);

const eachRows = each.map(([id, cat, en, ar, price, sort]) =>
  `  ('${id}', '${cat}', '${esc(en)}', '${esc(ar)}', null, null, null, null, null, null, ${sqlNum(p(price))}, ${sort})`
);

const plateRows = plates.map(([id, cat, en, ar, two, three, sort]) =>
  `  ('${id}', '${cat}', '${esc(en)}', '${esc(ar)}', null, null, null, ${sqlNum(p(two))}, ${sqlNum(p(three))}, null, null, ${sort})`
);

const boxRows = boxes.map(([id, cat, en, ar, sm, md, lg, sort]) =>
  `  ('${id}', '${cat}', '${esc(en)}', '${esc(ar)}', null, null, null, ${sqlNum(p(sm))}, ${sqlNum(p(md))}, ${sqlNum(p(lg))}, null, ${sort})`
);

const allItems = [...breadRows, ...eachRows, ...plateRows, ...boxRows].join(",\n");

const sql = `-- El Shabrawy menu — printed prices + ${BUMP} EGP.
-- Bread: فينو / بلدي / شامي. Boxes: صغير / وسط / كبير. Plates: 2 بيض / 3 بيض.

insert into public.menu_categories (id, name, name_ar, tiered, sort) values
${catSql}
on conflict (id) do update set name=excluded.name, name_ar=excluded.name_ar, tiered=excluded.tiered, sort=excluded.sort;

delete from public.menu_items;
delete from public.menu_categories where id not in (${cats.map(([id]) => `'${id}'`).join(", ")});

insert into public.menu_items
  (id, category_id, name, name_ar, price_shami, price_balady, price_fino, price_sm, price_md, price_lg, price_each, sort)
values
${allItems};
`;

await writeFile(join(root, "supabase", "seed_menu.sql"), sql);
console.log("wrote supabase/seed_menu.sql", bread.length + each.length + plates.length + boxes.length, "items, +", BUMP, "EGP");
