const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// MongoDB'ye bağlan
mongoose
  .connect("mongodb://localhost:27017/kutuphane", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB veritabanına bağlandı");
    // Sunucuyu başlat
    app.listen(3000, () => {
      console.log("Sunucu 3000 numaralı portta çalışıyor...");
    });
  })
  .catch((error) => {
    console.error("MongoDB bağlantı hatası:", error);
  });

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, "gizliAnahtar", (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.get("/protected", authenticateToken, (req, res) => {
  res.send(`<h1>Korumalı Sayfa. Hoş geldiniz, ${req.user.username}!</h1>`);
});

// Kullanıcı modeli
const User = mongoose.model("User", {
  username: String,
  password: String,
});

// Giriş sayfasını sunan route
app.get("/login", (req, res) => {
  res.send(`
    <h1>Giriş Yap</h1>
    <form action="/login" method="post">
      <input type="text" name="username" placeholder="Kullanıcı adı" required /><br>
      <input type="password" name="password" placeholder="Parola" required /><br>
      <button type="submit">Giriş Yap</button>
    </form>
    <p>Hesabınız yok mu? <a href="/signup">Kayıt Ol</a></p>
  `);
});

// Giriş formunu işleyen route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password });

    if (user) {
      // Kullanıcı bulundu, JWT oluştur ve yanıtla birlikte gönder
      const token = jwt.sign({ username: user.username }, "gizliAnahtar");
      // Kullanıcı başarıyla giriş yaptıktan sonra ana sayfaya yönlendir
      res.redirect("/homepage");
    } else {
      res.send("<h1>Giriş başarısız. Kullanıcı adı veya parola yanlış.</h1>");
    }
  } catch (error) {
    console.error("Giriş işlemi hatası:", error);
    res.send("<h1>Giriş işlemi sırasında bir hata oluştu.</h1>");
  }
});

// Ana sayfa route'u
app.get("/homepage", (req, res) => {
  // Bu kısımda kullanıcının giriş yaptıktan sonra görmesi gereken içeriği oluşturabilirsiniz.
  res.send("<h1>Ana sayfaya hoş geldiniz!</h1>");
});

// Kayıt olma sayfasını sunan route
app.get("/signup", (req, res) => {
  res.send(`
    <h1>Kayıt Ol</h1>
    <form action="/signup" method="post">
      <input type="text" name="username" placeholder="Kullanıcı adı" required /><br>
      <input type="password" name="password" placeholder="Parola" required /><br>
      <button type="submit">Kayıt Ol</button>
    </form>
    <p>Zaten bir hesabınız var mı? <a href="/login">Giriş Yap</a></p>
  `);
});

// Kayıt formunu işleyen route
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;

  try {
    const newUser = new User({ username, password });
    await newUser.save();
    res.send("<h1>Kayıt başarılı. Artık giriş yapabilirsiniz.</h1>");
  } catch (error) {
    console.error("Kayıt işlemi hatası:", error);
    res.send("<h1>Kayıt işlemi sırasında bir hata oluştu.</h1>");
  }
});
