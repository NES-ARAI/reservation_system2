const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const db = new sqlite3.Database(':memory:'); // 一時的なメモリ内データベース

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// データベースの初期化
db.serialize(() => {
    db.run("CREATE TABLE reservations (id INTEGER PRIMARY KEY, date TEXT, startTime TEXT, endTime TEXT, name TEXT, email TEXT)");
    db.run("CREATE TABLE schedules (id INTEGER PRIMARY KEY, date TEXT, startTime TEXT, endTime TEXT, capacity INTEGER, currentCount INTEGER)");
});

// 予約の取得
app.get('/reservations', (req, res) => {
    db.all("SELECT * FROM reservations", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// 予約の追加
app.post('/reserve', (req, res) => {
    const { date, startTime, endTime, name, email } = req.body;

    // スケジュールのキャパシティチェック
    db.get("SELECT capacity, currentCount FROM schedules WHERE date = ? AND startTime = ? AND endTime = ?", [date, startTime, endTime], (err, schedule) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (schedule.currentCount >= schedule.capacity) {
            res.status(400).json({ error: 'Capacity reached' });
            return;
        }

        // 予約の追加
        const stmt = db.prepare("INSERT INTO reservations (date, startTime, endTime, name, email) VALUES (?, ?, ?, ?, ?)");
        stmt.run(date, startTime, endTime, name, email, function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // スケジュールの更新
            db.run("UPDATE schedules SET currentCount = currentCount + 1 WHERE date = ? AND startTime = ? AND endTime = ?", [date, startTime, endTime], (err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

             // メール送信設定
　　　　　　　　　　　　const transporter = nodemailer.createTransport({
  　　　　　　　　　　　　  service: 'gmail',
    　　　　　　　　　　　　auth: {
       　　　　　　　　　　 user: process.env.GMAIL_USER,
       　　　　　　　　　　 pass: process.env.GMAIL_PASS
   　　　　　　　　　　　　　　　　　　　　　　 }
　　　　　　　　　　　　　　　　　　　　　　});

                const mailOptions = {
                    from: 'yuichi_arai@nes-english-school.com',
                    to: `${email}, nes.yuichi.arai@gmail.com`,
                    subject: '予約確認',
                    text: `
                    ${name}先生

                    講師面談の予約が完了しました。

                    日時: ${date} ${startTime} - ${endTime}

                    後日改めてZOOMリンクをお送りいたします。
                    どうぞよろしくお願いいたします。

                    本校　新井
                    `
                };

                transporter.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        console.log(error);
                        res.status(500).json({ error: '予約は完了しましたが、確認メールの送信に失敗しました' });
                    } else {
                        res.json({ id: this.lastID });
                    }
                });
            });
        });
        stmt.finalize();
    });
});

// スケジュールの取得
app.get('/schedules', (req, res) => {
    db.all("SELECT * FROM schedules", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// スケジュールの追加
app.post('/schedule', (req, res) => {
    const { date, startTime, endTime, capacity } = req.body;
    const stmt = db.prepare("INSERT INTO schedules (date, startTime, endTime, capacity, currentCount) VALUES (?, ?, ?, ?, 0)");
    stmt.run(date, startTime, endTime, capacity, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID });
    });
    stmt.finalize();
});

// スケジュールの削除
app.delete('/schedule/:id', (req, res) => {
    const id = req.params.id;
    const stmt = db.prepare("DELETE FROM schedules WHERE id = ?");
    stmt.run(id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.sendStatus(200);
    });
    stmt.finalize();
});

// スケジュールの修正
app.put('/schedule/:id', (req, res) => {
    const id = req.params.id;
    const { date, startTime, endTime, capacity } = req.body;
    const stmt = db.prepare("UPDATE schedules SET date = ?, startTime = ?, endTime = ?, capacity = ? WHERE id = ?");
    stmt.run(date, startTime, endTime, capacity, id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.sendStatus(200);
    });
    stmt.finalize();
});

// 予約の削除
app.delete('/reservation/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT date, startTime, endTime FROM reservations WHERE id = ?", [id], (err, reservation) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        const stmt = db.prepare("DELETE FROM reservations WHERE id = ?");
        stmt.run(id, function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // スケジュールの更新
            db.run("UPDATE schedules SET currentCount = currentCount - 1 WHERE date = ? AND startTime = ? AND endTime = ?", [reservation.date, reservation.startTime, reservation.endTime], (err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.sendStatus(200);
            });
        });
        stmt.finalize();
    });
});

// CSVエクスポート
app.get('/export', (req, res) => {
    db.all("SELECT * FROM reservations", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        let csv = '\uFEFF名前,メールアドレス,予約日,開始時間,終了時間\n';
        rows.forEach(row => {
            csv += `${row.name},${row.email},${row.date},${row.startTime},${row.endTime}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment;filename=reservations.csv');
        res.send(csv);
    });
});


// サーバーの起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
