-- Employee seed generated from data/распоред 2026.doc.
-- This inserts employees by full_name only when that name does not already exist.
-- Missing fields such as email, phone, job_title, department, and start date are left null.
-- The source "ден" column is used as yearly_vacation_days. Blank values use 20 and are noted.

with source_employees (full_name, yearly_vacation_days, service_years, source_days_was_blank) as (
  values
    ('Надица Гировска', 26, '32', false),
    ('Никола Грковски', 25, '16', false),
    ('Сенида Шкријељ', 24, '5', false),
    ('Мимоза Петковска', 20, null, true),
    ('Наташа Тодоровска', 26, '29', false),
    ('Суеда Бајрактар', 26, '21', false),
    ('Ценче Башоска', 26, '21', false),
    ('Велибор Стојановски', 24, '8', false),
    ('Цветанка Тодорова', 20, '16', true),
    ('Љупка Буцевска', 20, null, true),
    ('Анкица В.Гроздоска', 20, '19', true),
    ('Оливера Д.Иљоска', 25, '15', false),
    ('Томе Диндев', 24, '5', false),
    ('Весна Каровска', 26, '35', false),
    ('Вања Н.Петровска', 20, null, true),
    ('Соња Тошевска', 26, '29', false),
    ('Суза Ангелевска', 26, '28', false),
    ('Оливера Цветаноска', 25, '14', false),
    ('Маја Димоска', 24, '13', false),
    ('Христина Атанасовски', 25, '10', false),
    ('Олга Котевска', 24, '9', false),
    ('Лилјана Илиевска', 24, '9', false),
    ('Симона Јаневска', 24, '8', false),
    ('Елизабета Здравковска', 25, '26', false),
    ('Елизабета Серафимовска', 25, '26', false),
    ('Силвана Николовска', 24, '23', false),
    ('Валентина Кантарџиева', 25, '21', false),
    ('Снежана Стојоска', 24, '15', false),
    ('Зорица Колева', 24, '14', false),
    ('Зорица П.Ристов', 20, '13', true),
    ('Биљана Петровска', 24, '12', false),
    ('Василија Андоновска', 23, '8', false),
    ('Бранкица Додиќ', 23, '8', false),
    ('Ивана Ѓорчевска', 23, '6', false),
    ('Благица Вангеловска', 23, '5', false),
    ('Милена Д.Стаменковиќ', 20, null, true),
    ('Тони Трпчевски', 25, '30', false),
    ('Александра Трајановска', 23, '14', false),
    ('Елена Тренковска', 23, '14', false),
    ('Драгана Петковска', 22, '9', false),
    ('Вики', 20, null, true),
    ('Горан Тосев', 26, '30', false),
    ('Владимир Ивановски', 24, '19', false),
    ('Сузана Аврамовска', 24, '33', false),
    ('Анкица Петрушевска', 24, '24', false),
    ('Весна Николовска', 24, '23', false),
    ('Марица Велковска', 23, '11', false)
)
insert into public.employees (
  full_name,
  employment_status,
  yearly_vacation_days,
  notes
)
select
  source.full_name,
  'active',
  source.yearly_vacation_days,
  trim(both ' ' from concat(
    'Imported from распоред 2026.doc.',
    case
      when source.service_years is not null then ' Стаж: ' || source.service_years || '.'
      else ''
    end,
    case
      when source.source_days_was_blank then ' Vacation days were blank in source; defaulted to 20.'
      else ''
    end
  ))
from source_employees source
where not exists (
  select 1
  from public.employees existing
  where lower(existing.full_name) = lower(source.full_name)
);
