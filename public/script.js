document.addEventListener('DOMContentLoaded', function() {
    // Hello API button
    const helloBtn = document.getElementById('hello-btn');
    const helloResult = document.getElementById('hello-result');
    
    // Echo test elements
    const echoBtn = document.getElementById('echo-btn');
    const echoInput = document.getElementById('echo-input');
    const echoResult = document.getElementById('echo-result');

    // Hello API call
    helloBtn.addEventListener('click', async function() {
        try {
            helloResult.textContent = '読み込み中...';
            const response = await fetch('/api/hello');
            const data = await response.json();
            helloResult.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
            helloResult.textContent = 'エラー: ' + error.message;
        }
    });

    // Echo API call
    echoBtn.addEventListener('click', async function() {
        const message = echoInput.value.trim();
        if (!message) {
            echoResult.textContent = 'メッセージを入力してください。';
            return;
        }

        try {
            echoResult.textContent = '送信中...';
            const response = await fetch('/api/echo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });
            const data = await response.json();
            echoResult.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
            echoResult.textContent = 'エラー: ' + error.message;
        }
    });

    // Enter key support for echo input
    echoInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            echoBtn.click();
        }
    });
});