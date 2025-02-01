
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt'); // لتشفير كلمة المرور

const app = express();
app.use(express.json());

// إنشاء اتصال بقاعدة البيانات
const db = mysql.createConnection({
    host: 'https://www.noorstations.com',
    user: 'adminroot',
    password: "P@$$w0rd!K@r3m*",
    database: "adminroot_db",
    port: 3306 
});

// التحقق من الاتصال بقاعدة البيانات
db.connect((err) => {
    if (err) {
        console.error('حدث خطأ أثناء الاتصال بقاعدة البيانات: ', err);
        return;
    }
    console.log('تم الاتصال بقاعدة البيانات بنجاح');
});

// تسجيل الدخول
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
        if (err) {
            console.error('خطأ في استعلام قاعدة البيانات: ', err);
            return res.status(500).send('حدث خطأ أثناء محاولة تسجيل الدخول');
        }

        if (result.length === 0) {
            return res.status(404).send('المستخدم غير موجود');
        }

        const user = result[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                return res.status(500).send('حدث خطأ أثناء التحقق من كلمة المرور');
            }

            if (isMatch) {
                // تسجيل الدخول بنجاح
                return res.status(200).send(`مرحباً ${user.username}!`);
            } else {
                return res.status(400).send('كلمة المرور غير صحيحة');
            }
        });
    });
});

// تشغيل التطبيق على المنفذ 3000
app.listen(3000, () => {
    console.log('الخادم يعمل على المنفذ 3000');
});
