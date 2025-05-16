let upColor = document.getElementById('volumeUpColor').value;
let downColor = document.getElementById('volumeDownColor').value;

document.getElementById('volumeUpColor').addEventListener('input', (e) => {
    upColor = e.target.value;
    updateVolumeColors();
});
document.getElementById('volumeDownColor').addEventListener('input', (e) => {
    downColor = e.target.value;
    updateVolumeColors();
});

function updateVolumeColors() {
    if (!window.volumeSeries || !window.lastVolumeData) return;
    window.volumeSeries.setData(
        window.lastVolumeData.map(d => ({
            time: d.time,
            value: d.volume,
            color: d.close > d.open ? upColor : downColor
        }))
    );
}

document.addEventListener('DOMContentLoaded', () => {
    const handle = document.createElement('div');
    handle.style.position = 'absolute';
    handle.style.left = '0';
    handle.style.right = '0';
    handle.style.height = '8px';
    handle.style.bottom = '80px'; // 초기 위치
    handle.style.cursor = 'ns-resize';
    handle.style.background = 'rgba(61,178,255,0.18)';
    handle.style.zIndex = 20;
    handle.style.borderRadius = '4px';
    handle.style.transition = 'background 0.2s';
    handle.onmouseenter = () => handle.style.background = 'rgba(61,178,255,0.35)';
    handle.onmouseleave = () => handle.style.background = 'rgba(61,178,255,0.18)';
    document.getElementById('chart-container').appendChild(handle);

    let isDragging = false;
    let startY = 0;
    let startTop = 0;

    handle.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        // 현재 scaleMargins.top 값 기억
        startTop = window.volumeSeries.options().scaleMargins.top;
        document.body.style.userSelect = 'none';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const deltaY = e.clientY - startY;
        // 차트 높이 기준으로 비율 계산
        const chartHeight = document.getElementById('chart-container').clientHeight;
        let newTop = startTop + deltaY / chartHeight;
        // 값 제한 (0.7~0.97)
        newTop = Math.max(0.7, Math.min(0.97, newTop));
        window.volumeSeries.applyOptions({ scaleMargins: { top: newTop, bottom: 0 } });
        // 핸들 위치도 같이 이동
        handle.style.bottom = `${chartHeight * (1 - newTop) - 4}px`;
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.userSelect = '';
        }
    });

    // 차트 리사이즈 시 핸들 위치 재조정
    window.addEventListener('resize', () => {
        const chartHeight = document.getElementById('chart-container').clientHeight;
        const top = window.volumeSeries.options().scaleMargins.top;
        handle.style.bottom = `${chartHeight * (1 - top) - 4}px`;
    });
});
