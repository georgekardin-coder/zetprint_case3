let currentUser = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = savedUser;
    displayUserInfo();
    loadSubscriptionList();
    renderPostsFeed();
  }
});

// Авторизация пользователя
function handleLogin() {
  const usernameInput = document.getElementById('username');
  const username = usernameInput.value.trim();

  if (!username) {
    alert('Пожалуйста, введите имя пользователя.');
    return;
  }

  currentUser = username;
  localStorage.setItem('currentUser', username);

  // Инициализация данных пользователя, если они отсутствуют
  if (!localStorage.getItem(`user_${username}_posts`)) {
    localStorage.setItem(`user_${username}_posts`, JSON.stringify([]));
  }
  if (!localStorage.getItem(`user_${username}_subscriptions`)) {
    localStorage.setItem(`user_${username}_subscriptions`, JSON.stringify([]));
  }

  displayUserInfo();
  document.getElementById('post-form').style.display = 'block';
  usernameInput.value = '';
  loadSubscriptionList();
  renderPostsFeed();
}

// Выход из системы
function handleLogout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  document.getElementById('user-info').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('post-form').style.display = 'none';
  renderPostsFeed();
}

// Отображение информации о текущем пользователе
function displayUserInfo() {
  document.getElementById('current-user').textContent = currentUser;
  document.getElementById('user-info').style.display = 'block';
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('post-form').style.display = 'block';
}

// Подписка на пользователя
function handleSubscribe() {
  if (!currentUser) {
    alert('Пожалуйста, войдите в систему.');
    return;
  }

  const targetUser = document.getElementById('subscribe-to').value.trim();
  if (!targetUser) {
    alert('Введите имя пользователя для подписки.');
    return;
  }

  if (targetUser === currentUser) {
    alert('Нельзя подписаться на самого себя.');
    return;
  }

  const subscriptions = JSON.parse(localStorage.getItem(`user_${currentUser}_subscriptions`) || '[]');
  if (subscriptions.includes(targetUser)) {
    alert('Вы уже подписаны на этого пользователя.');
    return;
  }

  subscriptions.push(targetUser);
  localStorage.setItem(`user_${currentUser}_subscriptions`, JSON.stringify(subscriptions));
  alert(`Вы успешно подписались на ${targetUser}.`);
  loadSubscriptionList();
  renderPostsFeed();
  document.getElementById('subscribe-to').value = '';
}

// Отписка от пользователя
function handleUnsubscribe(username) {
  const subscriptions = JSON.parse(localStorage.getItem(`user_${currentUser}_subscriptions`) || '[]');
  const updatedSubscriptions = subscriptions.filter(user => user !== username);
  localStorage.setItem(`user_${currentUser}_subscriptions`, JSON.stringify(updatedSubscriptions));
  loadSubscriptionList();
  renderPostsFeed();
}

// Загрузка списка подписок
function loadSubscriptionList() {
  const container = document.getElementById('subscription-list');
  if (!currentUser) {
    container.innerHTML = '<p>Войдите в систему, чтобы управлять подписками.</p>';
    return;
  }

  const subscriptions = JSON.parse(localStorage.getItem(`user_${currentUser}_subscriptions`) || '[]');
  if (subscriptions.length === 0) {
    container.innerHTML = '<p>У вас пока нет подписок.</p>';
    return;
  }

  container.innerHTML = subscriptions.map(user => `
    <span class="subscription-item">
      ${user}
      <button onclick="handleUnsubscribe('${user}')">Отписаться</button>
    </span>
  `).join('');
}

// Создание нового поста
function handleCreatePost() {
  if (!currentUser) {
    alert('Пожалуйста, войдите в систему.');
    return;
  }

  const content = document.getElementById('post-content').value.trim();
  const tagInput = document.getElementById('post-tags').value;
  const isPrivate = document.getElementById('private-post').checked;

  if (!content) {
    alert('Текст поста не может быть пустым.');
    return;
  }

  const tags = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

  const newPost = {
    id: Date.now().toString(),
    author: currentUser,
    content: content,
    tags: tags,
    isPrivate: isPrivate,
    comments: [],
    createdAt: new Date().toLocaleString('ru-RU')
  };

  const userPosts = JSON.parse(localStorage.getItem(`user_${currentUser}_posts`) || '[]');
  userPosts.push(newPost);
  localStorage.setItem(`user_${currentUser}_posts`, JSON.stringify(userPosts));

  // Сброс формы
  document.getElementById('post-content').value = '';
  document.getElementById('post-tags').value = '';
  document.getElementById('private-post').checked = false;

  renderPostsFeed();
  alert('Пост успешно опубликован.');
}

// Отображение ленты постов
function renderPostsFeed() {
  const container = document.getElementById('posts-feed');
  if (!currentUser) {
    container.innerHTML = '<p>Войдите в систему, чтобы просматривать ленту постов.</p>';
    return;
  }

  const subscriptions = JSON.parse(localStorage.getItem(`user_${currentUser}_subscriptions`) || '[]');
  const authorsToDisplay = [...subscriptions, currentUser];

  let allPosts = [];

  authorsToDisplay.forEach(author => {
    const authorPosts = JSON.parse(localStorage.getItem(`user_${author}_posts`) || '[]');
    authorPosts.forEach(post => {
      allPosts.push({ ...post, author: author });
    });
  });

  // Сортировка по дате (новые сверху)
  allPosts.sort((a, b) => b.id - a.id);

  if (allPosts.length === 0) {
    container.innerHTML = '<p>Постов пока нет. Будьте первым, кто опубликует запись!</p>';
    return;
  }

  container.innerHTML = allPosts.map(post => {
    const isAuthor = post.author === currentUser;
    const canViewContent = isAuthor || !post.isPrivate;

    let postHTML = `
      <div class="post ${post.isPrivate ? 'private' : ''}">
        <h3>Автор: ${post.author}</h3>
        <p>${canViewContent ? post.content : '🔒 Этот пост скрыт. Доступ возможен только по запросу.'}</p>
    `;

    if (post.isPrivate && !isAuthor) {
      postHTML += `
        <button onclick="alert('Запрос на доступ к посту отправлен автору. В демонстрационной версии функция реализована уведомлением.')">
          Запросить доступ
        </button>
      `;
    }

    postHTML += `
        <div class="meta">Опубликовано: ${post.createdAt}</div>
        <div class="tags">
          ${post.tags.map(tag => `<span>#${tag}</span>`).join('')}
        </div>
    `;

    if (isAuthor) {
      postHTML += `
        <div class="actions">
          <button onclick="handleEditPost('${post.id}')">Редактировать</button>
          <button onclick="handleDeletePost('${post.id}')">Удалить</button>
        </div>
      `;
    }

    // Комментарии
    postHTML += `
        <div class="comment-section">
          <h4>Комментарии (${post.comments.length})</h4>
          <textarea id="comment_${post.id}" placeholder="Напишите комментарий..."></textarea>
          <button onclick="handleAddComment('${post.id}', '${post.author}')">Отправить</button>
          <div id="comments_${post.id}">
            ${post.comments.map(comment => `
              <div class="comment">
                <strong>${comment.author}:</strong> ${comment.text}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    return postHTML;
  }).join('');
}

// Редактирование поста
function handleEditPost(postId) {
  const userPosts = JSON.parse(localStorage.getItem(`user_${currentUser}_posts`) || '[]');
  const post = userPosts.find(p => p.id === postId);

  if (!post) return;

  const updatedContent = prompt('Редактирование поста:', post.content);
  if (updatedContent === null) return;

  post.content = updatedContent;
  localStorage.setItem(`user_${currentUser}_posts`, JSON.stringify(userPosts));
  renderPostsFeed();
}

// Удаление поста
function handleDeletePost(postId) {
  if (!confirm('Вы уверены, что хотите удалить этот пост?')) return;

  const userPosts = JSON.parse(localStorage.getItem(`user_${currentUser}_posts`) || '[]');
  const updatedPosts = userPosts.filter(p => p.id !== postId);
  localStorage.setItem(`user_${currentUser}_posts`, JSON.stringify(updatedPosts));
  renderPostsFeed();
}

// Добавление комментария
function handleAddComment(postId, postAuthor) {
  if (!currentUser) {
    alert('Пожалуйста, войдите в систему, чтобы оставлять комментарии.');
    return;
  }

  const commentTextarea = document.getElementById(`comment_${postId}`);
  const commentText = commentTextarea.value.trim();

  if (!commentText) {
    alert('Комментарий не может быть пустым.');
    return;
  }

  // Получаем посты автора поста
  let authorPosts = JSON.parse(localStorage.getItem(`user_${postAuthor}_posts`) || '[]');
  const post = authorPosts.find(p => p.id === postId);

  if (!post) return;

  // Добавляем комментарий
  post.comments.push({
    author: currentUser,
    text: commentText,
    createdAt: new Date().toLocaleString('ru-RU')
  });

  // Сохраняем изменения
  localStorage.setItem(`user_${postAuthor}_posts`, JSON.stringify(authorPosts));

  // Очищаем поле ввода и обновляем ленту
  commentTextarea.value = '';
  renderPostsFeed();
}