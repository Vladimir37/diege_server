# Diege Server
Diege Server - это платформа для создания и ведения онлайн-блогов Diege Blog. Новые блоги создаются на поддомене адреса самой платформы. Diege Server содержит всё необходимое - страницу регистрации, помощь в установке и шаблон Diege Blog, ориентированный под работу в составе платформы Diege Server. При создании нового блога Diege Blog автоматически создаются все необходимые таблицы в базе данных, конфигурация nginx и происходит запуск блога.
## Техническая сторона
Diege Server написан целиком на Node.js и требует наличия СУБД MySQL с определёнными таблицами. Также необходим веб-сервер nginx. Все необходимые пакеты перечислены в package.json.
### Используемое ПО
<ul>
  <li>ОС: Любой Linux дистрибутив</li>
  <li>Node.js</li>
  <li>MySQL</li>
  <li>nginx</li>
</ul>
### Используемые npm пакеты
<ul>
  <li>Express</li>
  <li>Jade</li>
  <li>Body-parser</li>
  <li>Formidable</li>
  <li>Cookie-parser</li>
  <li>Easy-encryption</li>
  <li>Random-token</li>
  <li>Serve-favicon</li>
  <li>Nodemailer</li>
  <li>Forever</li>
  <li>NCP</li>
</ul>
