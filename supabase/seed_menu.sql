-- ============================================================
-- El Shabrawy menu seed (EGP). Run once, after schema.sql.
-- Re-runnable: upserts on primary key.
-- ============================================================

insert into public.menu_categories (id, name, name_ar, tiered, sort) values
  ('foul',    'Foul Sandwiches',    'سندوتشات الفول',    false, 1),
  ('taameya', 'Falafel Sandwiches', 'سندوتشات الطعمية',  false, 2),
  ('batates', 'Potato Sandwiches',  'سندوتشات البطاطس',  false, 3),
  ('eggs',    'Egg Sandwiches',     'سندوتشات البيض',    false, 4),
  ('misc',    'Assorted Sandwiches','سندوتشات متنوعة',   false, 5),
  ('boxes',   'Combo Boxes — S/M/L','ركن العلب',         true,  6)
on conflict (id) do update set name=excluded.name, name_ar=excluded.name_ar, tiered=excluded.tiered, sort=excluded.sort;

-- Shami/Balady items: price_shami, price_balady set; S/M/L null
insert into public.menu_items (id, category_id, name, name_ar, price_shami, price_balady, sort) values
  ('foul-plain','foul','Foul','فول',12,14,1),
  ('foul-special','foul','Foul Special','فول مخصوص',15,17,2),
  ('foul-salsa','foul','Foul with Salsa','فول بالصلصة',15,17,3),
  ('foul-alex','foul','Foul Alexandrian','فول اسكندراني',15,17,4),
  ('foul-hot','foul','Foul Hot','فول حار',15,17,5),
  ('foul-olive','foul','Foul with Olives','فول زيتون',15,17,6),
  ('foul-corn','foul','Foul with Corn','فول ذرة',15,17,7),
  ('foul-butter','foul','Foul with Butter','فول زبدة',25,27,8),
  ('foul-ghee','foul','Foul with Balady Ghee','فول سمن بلدي',25,27,9),
  ('foul-egg','foul','Foul with Boiled Egg','فول بالبيض المسلوق',25,27,10),
  ('foul-omelet','foul','Foul with Omelette','فول أومليت',25,27,11),
  ('foul-bastr','foul','Foul with Basturma','فول بسطرمة',27,29,12),
  ('foul-sug','foul','Foul with Sausage','فول سجق',27,29,13),
  ('foul-meat','foul','Foul with Minced Meat','فول باللحمة المفرومة',27,29,14),
  ('foul-tahina','foul','Foul with Tahina','فول بالليه',27,29,15),

  ('tam-plain','taameya','Falafel','طعمية',12,14,1),
  ('tam-special','taameya','Falafel Special','طعمية مخصوص',15,17,2),
  ('tam-stuffed','taameya','Stuffed Falafel','طعمية محشية',15,17,3),
  ('tam-egg','taameya','Falafel with Boiled Egg','طعمية بالبيض المسلوق',25,27,4),
  ('tam-omelet','taameya','Falafel with Omelette','طعمية بالبيض الأومليت',25,27,5),
  ('tam-kiri','taameya','Falafel with Kiri Cheese','طعمية كيري',25,27,6),
  ('tam-bastr','taameya','Falafel with Basturma','طعمية بسطرمة',30,32,7),
  ('tam-fingers','taameya','Falafel on Fingers','طعمية على صوابع',22,24,8),
  ('tam-chips','taameya','Falafel on Chips','طعمية على شيبسي',22,24,9),
  ('tam-mozz','taameya','Falafel with Mozzarella','طعمية موتزاريلا',22,24,10),
  ('tam-eggpl','taameya','Falafel with Fried Aubergine','طعمية على باذنجان مقلي',22,24,11),

  ('bat-fingers','batates','Potato Fingers','صوابع',18,20,1),
  ('bat-chips','batates','Chips','شيبسي',18,20,2),
  ('bat-puree','batates','Purée','بوريه',18,20,3),
  ('bat-panne','batates','Panné','بانيه',19,21,4),
  ('bat-ketch','batates','Potato with Ketchup','بطاطس كاتشب',23,25,5),
  ('bat-mayo','batates','Potato with Mayo','بطاطس مايونيز',23,25,6),
  ('bat-mix','batates','Potato Ketchup & Mayo Mix','بطاطس ميكس كاتشب ومايونيز',25,27,7),
  ('bat-ched','batates','Potato with Cheddar','بطاطس شيدر',28,30,8),
  ('bat-roumi','batates','Potato with Roumi Cheese','بطاطس رومي',28,30,9),
  ('bat-boiled','batates','Potato with Boiled Egg','بطاطس بيض مسلوق',28,30,10),
  ('bat-omelet','batates','Potato with Omelette','بطاطس بالبيض الأومليت',28,30,11),
  ('bat-shrimp','batates','Potato with Shrimp','بطاطس جمبري',20,22,12),

  ('egg-roll','eggs','Rolled Egg','بيض مدحرج',20,22,1),
  ('egg-boiled','eggs','Boiled Egg','بيض مسلوق',17,19,2),
  ('egg-omelet','eggs','Omelette','بيض أومليت',20,22,3),
  ('egg-bastr','eggs','Egg with Basturma','بيض بسطرمة',30,32,4),
  ('egg-roumi','eggs','Roumi Omelette','بيض أومليت رومي',25,27,5),
  ('egg-ched','eggs','Cheddar Omelette','بيض أومليت شيدر',25,27,6),
  ('egg-saus','eggs','Sausage Omelette','بيض أومليت سوسيس',30,32,7),
  ('egg-chez-tom','eggs','Egg with Cheese & Tomato','بيض بالجبنة والطماطم',25,27,8),

  ('misc-eggpl','misc','Fried Aubergine','باذنجان مقلي',15,17,1),
  ('misc-baba','misc','Baba Ghanoush','بابا غنوج',15,17,2),
  ('misc-tomato','misc','Cheese with Tomato','جبنة بالطماطم',15,17,3),
  ('misc-french','misc','French Omelette','عجة فرنساوي',15,17,4),
  ('misc-mesa','misc','Moussaka','مسقعة',15,17,5),
  ('misc-mesa-mt','misc','Moussaka with Minced Meat','مسقعة باللحمة المفرومة',25,27,6),
  ('misc-mesa-sg','misc','Moussaka with Sausage','مسقعة بالسجق',25,27,7),
  ('misc-shak','misc','Shakshouka','شكشوكة',25,27,8),
  ('misc-egga','misc','Balady Egga','عجة بلدي',25,27,9),
  ('misc-fried','misc','Fried Cheese','جبنة مقلية',25,27,10)
on conflict (id) do update set
  category_id=excluded.category_id, name=excluded.name, name_ar=excluded.name_ar,
  price_shami=excluded.price_shami, price_balady=excluded.price_balady, sort=excluded.sort;

-- Combo boxes: S/M/L set; Shami/Balady null
insert into public.menu_items (id, category_id, name, name_ar, price_sm, price_md, price_lg, sort) values
  ('box-plain','boxes','Plain Foul Box','علبة فول سادة',15,20,30,1),
  ('box-mahmoug','boxes','Mahmoug Foul Box','علبة فول محموج',17,25,35,2),
  ('box-hotoil','boxes','Foul with Hot Oil Box','علبة فول بالزيت الحار',20,30,40,3),
  ('box-olive','boxes','Foul with Olive Oil Box','علبة فول بالزيت الزيتون',20,30,40,4),
  ('box-corn','boxes','Foul with Corn Oil Box','علبة فول بالزيت الذرة',17,25,35,5),
  ('box-butter','boxes','Foul with Balady Butter Box','علبة فول بالزبدة البلدي',25,35,45,6),
  ('box-sausage','boxes','Foul with Sausage Box','علبة فول بالسجق',25,40,45,7),
  ('box-ghee','boxes','Foul with Balady Ghee Box','علبة فول سمن بلدي',20,35,40,8),
  ('box-meat','boxes','Foul with Minced Meat Box','علبة فول باللحمة المفرومة',null,35,45,9),
  ('box-bastr','boxes','Foul with Basturma Box','علبة فول بالبسطرمة',null,35,45,10),
  ('box-tahina','boxes','Foul with Tahina Box','علبة فول بالليه',null,35,40,11),
  ('box-tesha','boxes','Foul with Tesha Box','علبة فول بالطشة',15,25,35,12),
  ('box-mesa','boxes','Moussaka Box','علبة مسقعة',17,30,40,13),
  ('box-batpur','boxes','Potato Purée Box','علبة بطاطس بوريه',17,30,40,14),
  ('box-baba','boxes','Baba Ghanoush Box','علبة بابا غنوج',17,30,40,15),
  ('box-shak','boxes','Shakshouka Box','علبة شكشوكة',20,30,40,16),
  ('box-mesa-mt','boxes','Moussaka with Minced Meat Box','علبة مسقعة باللحمة المفرومة',25,35,45,17),
  ('box-mesa-sg','boxes','Moussaka with Sausage Box','علبة مسقعة بالسجق',25,35,45,18),
  ('box-mesa-so','boxes','Moussaka with Sausages Box','علبة مسقعة بالسوسيس',25,35,45,19),
  ('box-taameya','boxes','Falafel Dough Box','علبة عجينة طعمية',17,25,35,20)
on conflict (id) do update set
  category_id=excluded.category_id, name=excluded.name, name_ar=excluded.name_ar,
  price_sm=excluded.price_sm, price_md=excluded.price_md, price_lg=excluded.price_lg, sort=excluded.sort;
