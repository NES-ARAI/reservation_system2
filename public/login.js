document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('login-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const adminId = document.getElementById('admin-id').value;
        const adminPassword = document.getElementById('admin-password').value;

        if (adminId === 'nes.hakusan.staff@gmail.com' && adminPassword === 'NESHakusan') {
            window.location.href = '/admin';
        } else {
            alert('ログインIDまたはパスワードが違います');
        }
    });
});
