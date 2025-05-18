import React, { useState } from 'react';

function AuthModal({ onLoginSuccess, setBlurOut, authOut, authIn }) {
  const [isSignup, setIsSignup] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupNickname, setSignupNickname] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPassword2, setSignupPassword2] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [nicknameCheck, setNicknameCheck] = useState('');

  // localStorage 유저 관리
  function getUsers() {
    return JSON.parse(localStorage.getItem('konga-users') || '[]');
  }
  function saveUsers(users) {
    localStorage.setItem('konga-users', JSON.stringify(users));
  }

  // 닉네임 중복확인
  const handleCheckNickname = () => {
    const users = getUsers();
    if (!signupNickname) {
      setNicknameCheck('닉네임을 입력하세요.');
    } else if (users.some(u => u.nickname === signupNickname)) {
      setNicknameCheck('이미 사용 중인 닉네임입니다.');
    } else {
      setNicknameCheck('사용 가능한 닉네임입니다!');
    }
  };

  // 회원가입
  const handleSignup = e => {
    e.preventDefault();
    const users = getUsers();
    if (!signupNickname || !signupEmail || !signupPassword || !signupPassword2) {
      setSignupError('모든 항목을 입력하세요.');
      return;
    }
    if (signupPassword !== signupPassword2) {
      setSignupError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (users.some(u => u.nickname === signupNickname)) {
      setSignupError('이미 사용 중인 닉네임입니다.');
      return;
    }
    if (users.some(u => u.email === signupEmail)) {
      setSignupError('이미 사용 중인 이메일입니다.');
      return;
    }
    users.push({ nickname: signupNickname, email: signupEmail, password: signupPassword });
    saveUsers(users);
    setSignupError('');
    alert('회원가입이 완료되었습니다! 이제 로그인 해주세요.');
    setIsSignup(false);
    setSignupNickname('');
    setSignupEmail('');
    setSignupPassword('');
    setSignupPassword2('');
    setNicknameCheck('');
  };

  // 로그인
  const handleLogin = e => {
    e.preventDefault();
    const users = getUsers();
    const user = users.find(u => u.email === loginEmail && u.password === loginPassword);
    if (user) {
      setLoginError('');
      setBlurOut(true);
      setTimeout(() => {
        localStorage.setItem('konga-current-user', JSON.stringify(user));
        onLoginSuccess(user);
      }, 1100);
    } else {
      setLoginError('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div className={`auth-modal-bg${authOut ? ' auth-out' : ''}${authIn ? ' auth-in' : ''}`}>
      <div className="auth-modal-card">
        <h1>KONGA</h1>
        {!isSignup ? (
          <>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="이메일"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                autoComplete="username"
                required
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="submit">로그인</button>
            </form>
            <div className="error-message">{loginError}</div>
            <div className="switch-auth">
              계정이 없으신가요?{' '}
              <span className="auth-link" onClick={() => setIsSignup(true)}>
                회원가입
              </span>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleSignup}>
              <input
                type="text"
                placeholder="닉네임"
                value={signupNickname}
                onChange={e => setSignupNickname(e.target.value)}
                required
              />
              <button type="button" onClick={handleCheckNickname}>
                닉네임 중복확인
              </button>
              <div className="error-message">{nicknameCheck}</div>
              <input
                type="text"
                placeholder="이메일"
                value={signupEmail}
                onChange={e => setSignupEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={signupPassword}
                onChange={e => setSignupPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="비밀번호 확인"
                value={signupPassword2}
                onChange={e => setSignupPassword2(e.target.value)}
                required
              />
              <button type="submit">회원가입</button>
            </form>
            <div className="error-message">{signupError}</div>
            <div className="switch-auth">
              이미 계정이 있으신가요?{' '}
              <span className="auth-link" onClick={() => setIsSignup(false)}>
                로그인
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthModal;
