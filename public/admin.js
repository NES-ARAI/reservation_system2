function initAdmin() {
    function loadSchedules() {
        fetch('/schedules')
            .then(response => response.json())
            .then(data => {
                const tbody = document.getElementById('admin-schedule-rows');
                tbody.innerHTML = '';
                data.forEach(schedule => {
                    const formattedDateTime = formatDateTime(schedule.date, schedule.startTime, schedule.endTime);
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${formattedDateTime.date}</td>
                        <td>${formattedDateTime.startTime} - ${formattedDateTime.endTime}</td>
                        <td>${schedule.capacity}</td>
                        <td>
                            <button class="delete-schedule-btn" data-id="${schedule.id}">削除</button>
                            <button class="update-schedule-btn" data-id="${schedule.id}">修正</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                attachScheduleButtonListeners();
            }).catch(error => {
                console.error('Error loading schedules:', error);
            });
    }

    function loadReservations() {
        fetch('/reservations')
            .then(response => response.json())
            .then(data => {
                const tbody = document.getElementById('reservation-rows');
                tbody.innerHTML = '';
                data.forEach(reservation => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${reservation.name}</td>
                        <td>${reservation.email}</td>
                        <td>${reservation.date}</td>
                        <td>${reservation.startTime}</td>
                        <td>${reservation.endTime}</td>
                        <td>
                            <button class="delete-reservation-btn" data-id="${reservation.id}">削除</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
                attachReservationButtonListeners();
            }).catch(error => {
                console.error('Error loading reservations:', error);
            });
    }

    function attachScheduleButtonListeners() {
        const deleteButtons = document.querySelectorAll('.delete-schedule-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (confirm('本当にこのスケジュールを削除しますか？')) {
                    fetch(`/schedule/${id}`, { method: 'DELETE' })
                        .then(response => {
                            if (response.ok) {
                                loadSchedules();
                            } else {
                                alert('スケジュールの削除に失敗しました');
                            }
                        }).catch(error => {
                            console.error('Error deleting schedule:', error);
                        });
                }
            });
        });

        const updateButtons = document.querySelectorAll('.update-schedule-btn');
        updateButtons.forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const newDate = prompt('新しい日にちを入力してください (YYYY-MM-DD):');
                const newStartTime = prompt('新しい開始時間を入力してください (HH:MM):');
                const newEndTime = prompt('新しい終了時間を入力してください (HH:MM):');
                const newCapacity = prompt('新しい定員を入力してください:');
                if (newDate && newStartTime && newEndTime && newCapacity) {
                    fetch(`/schedule/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ date: newDate, startTime: newStartTime, endTime: newEndTime, capacity: newCapacity })
                    }).then(response => {
                        if (response.ok) {
                            loadSchedules();
                        } else {
                            alert('スケジュールの修正に失敗しました');
                        }
                    }).catch(error => {
                        console.error('Error updating schedule:', error);
                    });
                }
            });
        });
    }

    function attachReservationButtonListeners() {
        const deleteButtons = document.querySelectorAll('.delete-reservation-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (confirm('本当にこの予約を削除しますか？')) {
                    fetch(`/reservation/${id}`, { method: 'DELETE' })
                        .then(response => {
                            if (response.ok) {
                                loadReservations();
                            } else {
                                alert('予約の削除に失敗しました');
                            }
                        }).catch(error => {
                            console.error('Error deleting reservation:', error);
                        });
                }
            });
        });
    }

    document.getElementById('schedule-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const date = document.getElementById('date').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const capacity = document.getElementById('capacity').value;
        fetch('/schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date, startTime, endTime, capacity })
        }).then(response => response.json())
        .then(data => {
            alert('スケジュールが登録されました');
            loadSchedules();
        }).catch(error => {
            console.error('Error registering schedule:', error);
            alert('スケジュールの登録に失敗しました');
        });
    });

    document.getElementById('export-csv').addEventListener('click', function() {
        fetch('/export')
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'reservations.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
            }).catch(error => {
                console.error('Error exporting CSV:', error);
                alert('CSVのエクスポートに失敗しました');
            });
    });

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
    loadReservations();
}
