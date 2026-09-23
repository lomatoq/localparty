'use strict';
// Reimplementations, not decoded original weapon data. Numbers below are our
// multiplayer tuning. Descriptions describe executable behavior in THIS build.
const profiles={
 jackhammer:{behavior:'jackhammer',bounces:5,description:'Пять вертикальных подскоков; взрыв при каждом ударе, без бокового отскока.'},
 tracer:{behavior:'tracer',damage:0,count:5,description:'Пять пробных траекторий без урона и кратеров. Метки показывают угол и расстояние до цели.'},
 super_tracer:{behavior:'tracer',damage:0,count:10,description:'Десять пробных траекторий: угол и расстояние до ближайшего танка, без урона.'},
 sniper_rifle:{behavior:'direct',family:'shell',gravity:0,speed:2,damage:65,description:'Быстрый прямой снаряд: прямое попадание даёт очки и толчок. Грунт останавливает пулю.'},
 tommy_gun:{behavior:'burst',count:8,spread:.012,description:'Очередь из восьми пуль с интервалом 80 мс, а не одновременный веер.'},
 minigun:{behavior:'burst',count:12,spread:.025,description:'Двенадцать последовательных пуль с небольшими взрывами.'},
 roman_candle:{behavior:'burst',count:6,spread:.015,description:'Шесть последовательно выпущенных светящихся зарядов.'},
 heatseeker:{behavior:'proximity',seekRadius:210,description:'Начинает наведение только вблизи танка; вдали летит по обычной дуге.'},
 homing_missile:{behavior:'dive',description:'При пролёте над противником гасит горизонтальную скорость и падает вертикально.'},
 quad_missile:{count:4,description:'Четыре одновременно выпущенных самонаводящихся снаряда.'},
 beehive:{count:6,description:'Шесть малых самонаводящихся снарядов; это адаптация, не оригинальный рой.'},
 ground_hog:{behavior:'tunnel',depth:28,description:'Прокладывает неглубокий подземный ход по направлению выстрела и выходит на поверхность.'},
 worm:{behavior:'worm',depth:45,description:'После входа в землю изгибает подземную траекторию вверх, оставляя тоннель.'},
 homing_worm:{behavior:'homing-worm',depth:40,description:'Идёт под землёй к танку, затем поднимается вертикально.'},
 late_bloomer:{behavior:'late-bloomer',count:5,depth:28,description:'Идёт под землёй; при выходе выбрасывает пять снарядов.'},
 dirt_mover:{behavior:'excavate',damage:0,description:'Вырезает направленный тоннель по вектору полёта. Не начисляет очки.'},
 digger:{behavior:'excavate',damage:0,radius:13,description:'Вырезает узкий направленный тоннель от точки попадания.'},
 flying_digger:{behavior:'excavate',damage:0,radius:15,description:'Вырезает направленный тоннель после приземления.'},
 well_digger:{behavior:'escape',damage:0,description:'Перед выстрелом очищает вертикальный канал над своим танком.'},
 magic_wall:{behavior:'wall',height:130,description:'Строит узкую вертикальную стену высотой 130 единиц.'},
 wall:{behavior:'wall',height:120,description:'Строит узкую прямоугольную стену высотой 120 единиц.'},
 pedestal:{behavior:'pedestal',height:140,description:'Поднимает собственный танк на столб грунта.'},
 dirt_slinger:{behavior:'slinger',description:'Создаёт два наклонных плеча грунта в форме V.'},
 dome_protect:{behavior:'dome',height:100,description:'Формирует земляной купол вокруг своего танка, с пустым пространством внутри.'},
 bouncy_dirt:{behavior:'rubber',description:'Покрывает поверхность упругим слоем. Следующий обычный снаряд отскакивает.'},
 bouncy_wall:{behavior:'rubber-wall',height:110,description:'Строит стену и покрывает её упругим слоем.'},
 glue_bomb:{behavior:'glue',description:'Снимает упругий слой и останавливает катящиеся снаряды на покрытом участке.'},
 cannon_ball:{behavior:'cannonball',description:'Тяжёлый шар катится по уклону и даёт очки за контакт, без взрывного кратера.'},
 heavy_roller:{behavior:'downhill',description:'Катится под действием уклона; взрывается при контакте с танком или после остановки.'},
 cruball:{behavior:'cruball',description:'Катится по поверхности, затем создаёт земляной шар вместо взрыва.'},
 wacky_tank:{behavior:'scramble',description:'После попадания изменяет угол и силу ближайших танков.'},
 hail_storm:{behavior:'hail',count:48,bounces:3,description:'48 мелких ледяных частиц с отскоками от уклона. Прямые контакты дают очки.'},
 old_faithful:{behavior:'hail',count:80,bounces:4,description:'80 отскакивающих частиц с ограниченным временем жизни.'},
 napalm:{behavior:'napalm',count:14,duration:3.2,description:'Разбрасывает 14 горящих капель; они оседают на земле и наносят периодический урон.'},
 flamethrower:{behavior:'napalm',count:18,duration:3.4,description:'18 горящих капель образуют широкий участок огня.'},
 laser_battery:{behavior:'laser-ring',count:12,description:'Из точки попадания испускает 12 радиальных лучей.'},
 zapper:{behavior:'zapper',family:'shell',seekRadius:120,description:'Летящий заряд выпускает короткий луч при приближении к танку.'},
 super_zapper:{behavior:'zapper',family:'shell',seekRadius:200,description:'Летящий заряд выпускает луч с увеличенной дистанции.'},
 flash_blast:{behavior:'flash',description:'Взрыв начисляет очки и отбрасывает танки, но не вырезает грунт.'}
};
const familyNotes={shell:'Обычный баллистический взрыв.',spread:'Одновременный веер снарядов.',cluster:'Разделение на фрагменты в вершине траектории.',rain:'Отложенные падающие заряды над точкой попадания.',bounce:'Отскоки по нормали поверхности, затем взрыв.',roller:'Движение по поверхности к ближайшей цели.',saw:'Движение по поверхности с малыми взрывами.',burrow:'Заглубление снаряда и подземный взрыв.',drill:'Последовательные взрывы вниз.',fire:'Горящая зона с периодическими попаданиями.',acid:'Зона с периодическим разрушением земли.',rail:'Мгновенный пробивающий луч.',lightning:'Вертикальная молния в точке удара.',laser:'Вертикальный луч и узкая шахта.',quake:'Цепочка ударов по поверхности.',dirt:'Создание земляного шара.',teleport:'Перенос танка в точку приземления.',jump:'Баллистический прыжок собственного танка.',pull:'Притягивание ближайших танков.',push:'Отбрасывание ближайших танков.',vortex:'Периодическое притяжение и финальный взрыв.',boomerang:'Смена горизонтального направления в полёте.',comet:'Взрыв с дополнительными ударами по бокам.',seeker:'Наведение на ближайший вражеский танк.',split:'Разделение на фрагменты по таймеру.',chain:'Последовательные взрывы в направлении цели.',pulse:'Несколько взрывных импульсов.',flower:'Веер новых снарядов из точки удара.',freeze:'Взрыв блокирует движение на один ход.',echo:'Отложенный повторный взрыв.'};
function enrich(w,i){
 const p=profiles[w.id],v={count:1,duration:2.5,depth:60,height:60,speed:1,...w,...p};
 if(!Number.isInteger(v.count)||v.count<1||v.count>96)throw Error('Invalid count: '+v.id);
 for(const key of ['radius','damage','duration','depth','speed'])if(!Number.isFinite(v[key])||v[key]<0)throw Error('Invalid '+key+': '+v.id);
 v.status=i<48?'original-design':p?'reimplemented':'simplified-adaptation';
 v.draft=i<48||!!p;
 if(i>=48&&!p)v.description=familyNotes[v.family]+' Упрощённая адаптация; оригинальное поведение не воспроизведено полностью.';
 v.iconFile=v.id.normalize('NFD').replace(/[\u0300-\u036f]/g,'')+'.svg';v.iconKey=v.behavior||v.family;v.index=i+1;return v;
}
module.exports={profiles,enrich};
