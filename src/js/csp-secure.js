// Proteger contra ataques XSS (Cross-site Scripting)
window.addEventListener('DOMContentLoaded', (event) => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        // Impedir a entrada de caracteres maliciosos
        const forbiddenChars = ['<', '>', '{', '}', ';', '"', "'"];
        if (forbiddenChars.includes(e.key)) {
          e.preventDefault();
        }
      });
    });
  });  