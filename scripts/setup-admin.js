import readline from 'readline';
import { hashPassword } from '../lib/auth.js';
import { store } from '../lib/store.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  console.log('\n======================================================');
  console.log('   ESTUDIO ANABELLA ZALAZAR - CONFIGURACIÓN DE ADMIN  ');
  console.log('======================================================\n');

  try {
    const emailInput = await ask('Ingrese el correo electrónico del administrador: ');
    const email = emailInput.trim().toLowerCase();
    
    if (!email || !email.includes('@')) {
      console.error('Error: Ingrese un correo electrónico válido.');
      process.exit(1);
    }

    const passwordInput = await ask('Ingrese la contraseña (mínimo 8 caracteres): ');
    const password = passwordInput.trim();

    if (!password || password.length < 8) {
      console.error('Error: La contraseña debe tener al menos 8 caracteres.');
      process.exit(1);
    }

    const nameInput = await ask('Nombre del administrador (por defecto "Anabella Zalazar"): ');
    const name = nameInput.trim() || 'Anabella Zalazar';

    const passwordHash = hashPassword(password);

    // Buscar si existe usuario o actualizar el primero
    let existingUser = store.getUserByEmail(email);
    if (existingUser) {
      existingUser.passwordHash = passwordHash;
      existingUser.name = name;
      store.save();
      console.log(`\n✓ Contraseña actualizada correctamente para el usuario: ${email}`);
    } else {
      // Reemplazar o agregar
      store.data.users = [
        {
          id: 'usr_admin',
          email,
          passwordHash,
          name,
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ];
      store.save();
      console.log(`\n✓ Cuenta de administrador creada correctamente: ${email}`);
    }

    console.log('\nPuede iniciar sesión en la ruta: /admin');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    rl.close();
  }
}

main();
