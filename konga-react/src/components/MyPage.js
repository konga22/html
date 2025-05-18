import React, { useState } from 'react';

function MyPage({ user, onUpdateUser, onLogout, onClose }) {
  const [nickname, setNickname] = useState(user.nickname);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [message, setMessage] = useState('');
  const [closeAnim, setCloseAnim] = useState(false);

  // localStorage 유저 관리 함수
  function getUsers() {
    return JSON.parse(localStorage.getItem('konga-users') || '[]');
  }
  function saveUsers(users) {
    localStorage.setItem('konga-users', JSON.stringify(users));
  }

  // 닉네임/비밀번호 변경
  const handleUpdate = e => {
    e.preventDefault();
    if (!nickname) {
      setMessage('닉네임을 입력하세요.');
      return;
    }
    if (password && password !== password2) {
      setMessage('비밀번호가 일치하지 않습니다.');
      return;
    }
    let users = getUsers();
    // 닉네임 중복 체크
    if (nickname !== user.nickname && users.some(u => u.nickname === nickname)) {
      setMessage('이미 사용 중인 닉네임입니다.');
      return;
    }
    users = users.map(u => {
      if (u.email === user.email) {
        return {
          ...u,
          nickname,
          password: password ? password : u.password,
        };
      }
      return u;
    });
    saveUsers(users);
    const updatedUser = { ...user, nickname, password: password ? password : user.password };
    localStorage.setItem('konga-current-user', JSON.stringify(updatedUser));
    onUpdateUser(updatedUser);
    setMessage('정보가 성공적으로 변경되었습니다!');
    setPassword('');
    setPassword2('');
  };

  const handleLogout = () => {
    localStorage.removeItem('konga-current-user');
    onLogout();
  };

  // 닫기 버튼 클릭 시
  const handleClose = () => {
    setCloseAnim(true);
    setTimeout(() => {
      onClose();
      setCloseAnim(false); // 다음에 다시 열 때를 위해 초기화
    }, 400); // 애니메이션 시간과 맞춤
  };

  return (
    <div className={`mypage-container${closeAnim ? ' mypage-close-anim' : ''}`}>
      <button className="mypage-close-btn" onClick={handleClose}>×</button>
      <h2>마이페이지</h2>
      <div className="mypage-info">
        <div>
          <span className="mypage-label">닉네임</span>
          <span className="mypage-value">{user.nickname}</span>
        </div>
        <div>
          <span className="mypage-label">이메일</span>
          <span className="mypage-value">{user.email}</span>
        </div>
      </div>
      <form className="mypage-form" onSubmit={handleUpdate}>
        <label>
          닉네임 변경
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            required
          />
        </label>
        <label>
          새 비밀번호
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="변경하지 않으려면 비워두세요"
          />
        </label>
        <label>
          새 비밀번호 확인
          <input
            type="password"
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            placeholder="변경하지 않으려면 비워두세요"
          />
        </label>
        <button type="submit" className="mypage-update-btn">정보 변경</button>
      </form>
      <div className="mypage-message">{message}</div>
      <button className="mypage-logout-btn" onClick={handleLogout}>로그아웃</button>
    </div>
  );
}

export default MyPage;
