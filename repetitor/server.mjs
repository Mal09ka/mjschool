import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const port = 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Читаем список учеников при старте сервера
let students = [];
const studentsPath = path.join(__dirname, 'students.json');
try {
  const studentsRaw = fs.readFileSync(studentsPath, 'utf8');
  students = JSON.parse(studentsRaw);
} catch (e) {
  console.error('Не удалось прочитать students.json:', e.message);
  students = [];
}

const server = http.createServer((req, res) => {
  // Главная страница
  if (req.url === '/' || req.url === '/index.html') {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) return sendError(res, 500, 'Ошибка чтения index.html');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  }
  
  // Страница регистрации
  else if (req.url === '/register.html') {
    const filePath = path.join(__dirname, 'register.html');
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) return sendError(res, 404, 'Страница регистрации не найдена');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
  }

  // Кабинет ученика: /student-dashboard.html?phone=+7999...
  else if (req.url.startsWith('/student-dashboard.html')) {
    // Парсим номер телефона из параметров URL
    const url = new URL(req.url, `http://localhost`);
    const phone = url.searchParams.get('phone');

    if (!phone) {
      // Если нет номера — просто отдаём пустую страницу (или можно сделать редирект)
      const filePath = path.join(__dirname, 'student-dashboard.html');
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return sendError(res, 404, 'student-dashboard.html не найден');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
      return;
    }

    // Ищем ученика по номеру
    const student = students.find(s => s.phone === phone);

    if (!student) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Ученика с таким номером не найдено. Добавь его в students.json.');
      return;
    }

    // Подставляем данные в шаблон страницы
    const filePath = path.join(__dirname, 'student-dashboard.html');
    fs.readFile(filePath, 'utf8', (err, html) => {
      if (err) return sendError(res, 500, 'Не удалось прочитать student-dashboard.html');

      const filledHtml = html
        .replace('{{NAME}}', student.name)
        .replace('{{SCHEDULE}}', student.schedule)
        .replace('{{HOMEWORK}}', student.homework)
        .replace('{{RECORDINGS}}', student.recordings);

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(filledHtml);
    });
  }

  // Отдача статики (картинки, иконки и т.д.)
  else {
    let filePath = path.join(__dirname, req.url);
    if (req.url.startsWith('/')) filePath = path.join(__dirname, req.url.slice(1));

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Файл не найден');
        return;
      }

      const ext = path.extname(filePath);
      let type = 'application/octet-stream';

      if (ext === '.html') type = 'text/html';
      else if (ext === '.css') type = 'text/css';
      else if (ext === '.js') type = 'application/javascript';
      else if (ext === '.jpg' || ext === '.jpeg') type = 'image/jpeg';
      else if (ext === '.png') type = 'image/png';
      else if (ext === '.ico') type = 'image/x-icon';
      else if (ext === '.svg') type = 'image/svg+xml';

      res.writeHead(200, { 'Content-Type': type });
      res.end(data);
    });
  }
});

function sendError(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(message);
}

server.listen(port, () => {
  console.log(`Сервер запущен: http://127.0.0.1:${port}`);
  console.log('Теперь можно проверять цепочку:');
  console.log('- Главная: http://127.0.0.1:3000');
  console.log('- Регистрация: http://127.0.0.1:3000/register.html');
  console.log('- Кабинет ученика (пример): http://127.0.0.1:3000/student-dashboard.html?phone=+79991112233');
});
