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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

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
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            window.location.href = 'logado.html'; // Redireciona para a página logada
        })
        .catch((error) => {
            alert('Erro ao fazer login: ' + error.message);
        });
});

// Cadastro
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert('Usuário cadastrado com sucesso! Faça login para continuar.');
            document.getElementById('registerFormContainer').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
        })
        .catch((error) => {
            alert('Erro ao cadastrar: ' + error.message);
        });
});

// Logout
document.getElementById('logoutButton').addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    });
});

// Adicionar Transação
document.getElementById('transactionForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    const secretKey = auth.currentUser.uid; // Usando o UID do usuário como chave secreta

    const encryptedDescription = CryptoJS.AES.encrypt(description, secretKey).toString();
    const encryptedAmount = CryptoJS.AES.encrypt(amount, secretKey).toString();

    db.collection('transactions').add({
        userId: auth.currentUser.uid,
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

// Carregar Transações
function loadTransactions() {
    const transactionList = document.getElementById('transactionList');
    transactionList.innerHTML = '';
    const secretKey = auth.currentUser.uid;

    db.collection('transactions').where('userId', '==', auth.currentUser.uid).get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const description = CryptoJS.AES.decrypt(data.description, secretKey).toString(CryptoJS.enc.Utf8);
                const amount = CryptoJS.AES.decrypt(data.amount, secretKey).toString(CryptoJS.enc.Utf8);

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
auth.onAuthStateChanged((user) => {
    if (user && window.location.pathname.endsWith('logado.html')) {
        loadTransactions();
    } else if (!user && !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
    }
});