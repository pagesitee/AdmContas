// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDu35uuQbU7in3DdyHnIYTbjM2v-NgoU88",
    authDomain: "admcontas-7d9d1.firebaseapp.com",
    projectId: "admcontas-7d9d1",
    storageBucket: "admcontas-7d9d1.firebasestorage.app",
    messagingSenderId: "454433031200",
    appId: "1:454433031200:web:ab76b846be709991b3e845",
    measurementId: "G-KE2LR9RV17"
};

// Inicializa o Firebase (usando a sintaxe compatível)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// Função para criptografar dados
function encryptData(data, secretKey) {
    return CryptoJS.AES.encrypt(data, secretKey).toString();
}

// Função para descriptografar dados
function decryptData(encryptedData, secretKey) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
}

// Função para alternar entre o formulário de login e cadastro
document.getElementById('showRegisterForm').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerFormContainer').style.display = 'block';
});

document.getElementById('showLoginForm').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerFormContainer').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
});

// Login
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Verifica o usuário no Firestore
    db.collection('users').where('username', '==', username).get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                alert('Usuário não encontrado.');
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            const decryptedPassword = decryptData(userData.password, username);

            if (decryptedPassword === password) {
                // Redireciona para a página logada
                window.location.href = 'logado.html';
            } else {
                alert('Senha incorreta.');
            }
        })
        .catch((error) => {
            alert('Erro ao fazer login: ' + error.message);
        });
});

// Cadastro
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    // Verifica se o usuário já existe
    db.collection('users').where('username', '==', username).get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                alert('Nome de usuário já existe.');
                return;
            }

            // Criptografa a senha antes de salvar
            const encryptedPassword = encryptData(password, username);

            // Salva o usuário no Firestore
            db.collection('users').add({
                username: username,
                password: encryptedPassword
            })
            .then(() => {
                alert('Usuário cadastrado com sucesso! Faça login para continuar.');
                document.getElementById('registerFormContainer').style.display = 'none';
                document.getElementById('loginForm').style.display = 'block';
            })
            .catch((error) => {
                alert('Erro ao cadastrar: ' + error.message);
            });
        })
        .catch((error) => {
            alert('Erro ao verificar usuário: ' + error.message);
        });
});

// Logout
if (document.getElementById('logoutButton')) {
    document.getElementById('logoutButton').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
}

// Adicionar Transação (na página logado.html)
if (document.getElementById('transactionForm')) {
    document.getElementById('transactionForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const description = document.getElementById('description').value;
        const amount = document.getElementById('amount').value;
        const secretKey = document.getElementById('username').value; // Usando o nome de usuário como chave secreta

        const encryptedDescription = encryptData(description, secretKey);
        const encryptedAmount = encryptData(amount, secretKey);

        db.collection('transactions').add({
            username: secretKey,
            description: encryptedDescription,
            amount: encryptedAmount,
            date: new Date()
        }).then(() => {
            alert('Transação adicionada com sucesso!');
            loadTransactions();
        }).catch((error) => {
            alert('Erro ao adicionar transação: ' + error.message);
        });
    });
}

// Carregar Transações (na página logado.html)
function loadTransactions() {
    const transactionList = document.getElementById('transactionList');
    transactionList.innerHTML = '';
    const secretKey = document.getElementById('username').value;

    db.collection('transactions').where('username', '==', secretKey).get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const description = decryptData(data.description, secretKey);
                const amount = decryptData(data.amount, secretKey);

                const li = document.createElement('li');
                li.textContent = `${description}: R$ ${amount}`;
                transactionList.appendChild(li);
            });
        })
        .catch((error) => {
            alert('Erro ao carregar transações: ' + error.message);
        });
}

// Verifica se o usuário está logado
const username = localStorage.getItem('username');
if (username && window.location.pathname.endsWith('logado.html')) {
    loadTransactions();
} else if (!username && !window.location.pathname.endsWith('index.html')) {
    window.location.href = 'index.html';
}
