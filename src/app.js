const express = require('express');
const handlebars = require('express-handlebars');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const router = require('./router');
const FilesDao = require('./dao/files.dao');
const cookieParser = require('cookie-parser');
const mongoConnect = require('./db');
const { cookieKey, PORT } = require('./config/security');
const session = require('express-session');
const fileStore = require('session-file-store');
const mongoStore = require('connect-mongo');
const fileStorage = fileStore(session);
const connectedUsers = new Set();
const chatFile = new FilesDao('chats.json');
const initializePassport = require('./config/passport.config')


// Cargar mensajes desde el archivo al inicio
let chats = [];

// Importo las rutas que has creado
const cartsRouter = require('./router/cartRoutes');
const chatRoutes = require('./router/chatRoutes');
const passport = require('passport');

const app = express();

mongoConnect();

app.use(express.json());
app.use(cookieParser(cookieKey));
app.use(session({
  store: mongoStore.create({
    mongoUrl: 'mongodb+srv://admin:admin@cluster0.0mdumnn.mongodb.net/ecommerce?retryWrites=true&w=majority',
    ttl: 10000,
  }),
  secret: 'secretLeonel',
  resave: false,
  saveUninitialized: false,
}));

initializePassport();
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(process.cwd() + '/src/public'));
app.use(express.static('public', { 'Content-Type': 'text/css' }));
app.engine('handlebars', handlebars.engine({
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
}));
app.set('views', process.cwd() + '/src/views');

// Colocar Passport antes de las rutas
router(app);

app.get('/', (req, res) => {
  res.redirect('/tienda/products');
});

app.use('/cart', cartsRouter);
app.use('/chat', chatRoutes);

app.get('/cookies/setCookies', (req, res) => {
  res.cookie('CoderCookie', 'Esta es una cookie poderosa', { maxAge: 10000 }).send("Cookie");
});

app.get('/cookies/getCookies', (req, res) => {
  console.log(req.cookies);
  console.log(req.signedCookies);
  res.json({ message: 'GET Cookies' });
});

app.get('/login/logout', (req, res) => {
  req.session.destroy();
  res.send('Sesión cerrada');
});

app.get('/cookies/deleteCookies', (req, res) => {
  res.clearCookie('CoderCookie').send('Cookie Removed');
});

app.get('/cookies/setSignedCookie', (req, res) => {
  res.cookie('SignedCookie', 'Esta es una cookie poderosa', { maxAge: 10000, signed: true }).send("Cookie");
});

async function loadChatsFromFile() {
  const data = await chatFile.getItems();
  chats = data.map((chat) => ({ ...chat, createdAt: new Date(chat.createdAt) }));
}

loadChatsFromFile();

const httpServer = app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});
const io = new Server(httpServer);

io.on('connection', (socket) => {
  socket.on('newUser', (data) => {
    socket.username = data.username;
    connectedUsers.add(data.username);
    socket.emit('messageLogs', chats);
    io.emit('userConnected', { username: data.username, connectedUsers: Array.from(connectedUsers) });
  });

  socket.on('message', (data) => {
    const message = { ...data, createdAt: new Date() };
    chats.push(message);
    io.emit('messageLogs', chats);
    // Escribir los mensajes en el archivo chat.json
    chatFile.writeItems(chats);
  });

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.username);
    io.emit('userDisconnected', { username: socket.username, connectedUsers: Array.from(connectedUsers) });

    // Crear un nuevo array de chats con la información de desconexión
    const disconnectionMessage = {
      username: socket.username,
      message: 'se ha desconectado',
      createdAt: new Date(),
    };

    chats.push(disconnectionMessage);
    io.emit('messageLogs', chats);
    // Escribir los mensajes en el archivo chat.json
    chatFile.writeItems(chats);
  });
});
