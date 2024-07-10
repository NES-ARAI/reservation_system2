document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('admin-login').addEventListener('click', function() {
        window.location.href = '/login';
    });

    function loadSchedules() {
        fetch('/schedules')
            .then(response => response.json())
            .then(data => {
                const tbody = document.getElementById('schedule-rows');
                tbody.innerHTML = '';
                data.forEach(schedule => {
                    const formattedDateTime = formatDateTime(schedule.date, schedule.startTime, schedule.endTime);
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${formattedDateTime.date}</td>
                        <td>${formattedDateTime.startTime} - ${formattedDateTime.endTime}</td>
                        <td>${schedule.capacity}</td>
                        <td>${schedule.currentCount}/${schedule.capacity}</td>
                        <td>
                            <button class="reserve-btn ${schedule.currentCount >= schedule.capacity ? 'full' : 'available'}" data-id="${schedule.id}" data-date="${schedule.date}" data-startTime="${schedule.startTime}" data-endTime="${schedule.endTime}" ${schedule.currentCount >= schedule.capacity ? 'disabled' : ''}>
                                ${schedule.currentCount >= schedule.capacity ? '×' : '〇'}
                            </button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                attachReserveButtonListeners();
            }).catch(error => {
                console.error('Error loading schedules:', error);
            });
    }

    function attachReserveButtonListeners() {
        const reserveButtons = document.querySelectorAll('.reserve-btn');
        reserveButtons.forEach(button => {
            button.addEventListener('click', function() {
                const date = this.getAttribute('data-date');
                const startTime = this.getAttribute('data-startTime');
                const endTime = this.getAttribute('data-endTime');
                const name = prompt('名前を入力してください:');
                const email = prompt('メールアドレスを入力してください:');
                if (name && email) {
                    const formattedDateTime = formatDateTime(date, startTime, endTime);
                    const confirmMessage = `${formattedDateTime.date} ${formattedDateTime.startTime} - ${formattedDateTime.endTime}の予約を行います。よろしいですか？`;
                    if (confirm(confirmMessage)) {
                        alert('予約が完了しました'); // すぐにメッセージを表示
                        fetch('/reserve', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ date, startTime, endTime, name, email })
                        }).then(response => response.json())
                        .then(data => {
                            loadSchedules();
                        }).catch(error => {
                            console.error('Error making reservation:', error);
                            alert('予約に失敗しました');
                        });
                    }
                }
            });
        });
    }

    function formatDateTime(date, startTime, endTime) {
        const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
        const dateObj = new Date(`${date}T${startTime}`);
        const dayOfWeek = daysOfWeek[dateObj.getDay()];
        return {
            date: `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日（${dayOfWeek}）`,
            startTime: startTime.replace(':', '時') + '分',
            endTime: endTime.replace(':', '時') + '分'
        };
    }

    loadSchedules();
});
