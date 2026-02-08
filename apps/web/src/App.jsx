import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:18110/v1";
const ACCOUNTS_KEY = "firstblush-demo-accounts";
const ACTIVE_KEY = "firstblush-demo-active";

function usePersistedState(key, initialValue) {
  const [state, setState] = useState(() => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return initialValue;
    try {
      return JSON.parse(raw);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

function niceTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function initials(name) {
  const raw = (name || "").trim();
  if (!raw) return "FB";
  const parts = raw.split(/\s+/).slice(0, 2);
  return parts.map((item) => item[0]?.toUpperCase() ?? "").join("");
}

export function App() {
  const [accounts, setAccounts] = usePersistedState(ACCOUNTS_KEY, []);
  const [activeToken, setActiveToken] = usePersistedState(ACTIVE_KEY, "");

  const [activeUser, setActiveUser] = useState(null);
  const [feed, setFeed] = useState([]);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [safetyEdges, setSafetyEdges] = useState([]);

  const [selectedPostId, setSelectedPostId] = useState("");
  const [chain, setChain] = useState([]);
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("Sign in to start building the FirstBlush graph.");

  const [authForm, setAuthForm] = useState({ provider: "apple", idToken: "", displayName: "" });
  const [composerForm, setComposerForm] = useState({ caption: "", videoUrl: "", visibility: "public", groupId: "" });
  const [reactionForm, setReactionForm] = useState({ videoUrl: "", parentReactionId: "" });
  const [commentDraft, setCommentDraft] = useState("");
  const [groupForm, setGroupForm] = useState({ name: "", description: "" });
  const [profileForm, setProfileForm] = useState({ displayName: "", bio: "", avatarUrl: "", interests: "" });
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  const activeAccount = useMemo(() => accounts.find((item) => item.token === activeToken), [accounts, activeToken]);
  const selectedPost = useMemo(() => feed.find((post) => post.id === selectedPostId), [feed, selectedPostId]);

  async function api(path, { method = "GET", body, auth = true } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth && activeToken) headers.Authorization = `Bearer ${activeToken}`;

    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `Request failed (${response.status})`);
    }
    return payload;
  }

  function setStatus(text) {
    setMessage(text);
  }

  async function loadDashboard() {
    if (!activeToken) return;
    try {
      const [meResult, feedResult, groupsResult, usersResult, notificationsResult, metricsResult, safetyResult] = await Promise.all([
        api("/me"),
        api("/feed"),
        api("/groups"),
        api("/users"),
        api("/notifications"),
        api("/creator/metrics"),
        api("/safety")
      ]);

      setActiveUser(meResult.user);
      setFeed(feedResult.items || []);
      setGroups(groupsResult.groups || []);
      setUsers((usersResult.users || []).filter((user) => user.id !== meResult.user.id));
      setNotifications(notificationsResult.notifications || []);
      setMetrics(metricsResult.metrics || null);
      setSafetyEdges(safetyResult.edges || []);

      setProfileForm({
        displayName: meResult.user.displayName || "",
        bio: meResult.user.bio || "",
        avatarUrl: meResult.user.avatarUrl || "",
        interests: (meResult.user.interests || []).join(", ")
      });
      setStatus(`Loaded dashboard for ${meResult.user.displayName}`);
    } catch (error) {
      setStatus(`Dashboard load failed: ${error.message}`);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeToken]);

  async function signIn(event) {
    event.preventDefault();
    try {
      const payload = await api(`/auth/${authForm.provider}`, {
        method: "POST",
        auth: false,
        body: {
          idToken: authForm.idToken,
          displayName: authForm.displayName || undefined
        }
      });

      const account = {
        token: payload.token,
        userId: payload.user.id,
        displayName: payload.user.displayName,
        provider: payload.user.provider
      };

      setAccounts((current) => {
        const next = current.filter((item) => item.userId !== account.userId);
        return [account, ...next];
      });
      setActiveToken(payload.token);
      setAuthForm((current) => ({ ...current, idToken: "", displayName: "" }));
      setStatus(`Signed in as ${payload.user.displayName}`);
    } catch (error) {
      setStatus(`Sign-in failed: ${error.message}`);
    }
  }

  async function quickSignIn(provider, name) {
    const tokenSeed = `${provider}-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    setAuthForm({ provider, idToken: tokenSeed, displayName: name });
    try {
      const payload = await api(`/auth/${provider}`, {
        method: "POST",
        auth: false,
        body: {
          idToken: tokenSeed,
          displayName: name
        }
      });
      const account = {
        token: payload.token,
        userId: payload.user.id,
        displayName: payload.user.displayName,
        provider: payload.user.provider
      };
      setAccounts((current) => {
        const next = current.filter((item) => item.userId !== account.userId);
        return [account, ...next];
      });
      setActiveToken(payload.token);
      setStatus(`Quick signed in ${name}`);
    } catch (error) {
      setStatus(`Quick sign-in failed: ${error.message}`);
    }
  }

  async function logout() {
    if (!activeToken) return;
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // session may already be gone
    }
    setAccounts((current) => current.filter((item) => item.token !== activeToken));
    setActiveToken("");
    setActiveUser(null);
    setFeed([]);
    setGroups([]);
    setUsers([]);
    setNotifications([]);
    setMetrics(null);
    setSafetyEdges([]);
    setChain([]);
    setComments([]);
    setSelectedPostId("");
    setStatus("Logged out.");
  }

  async function updateProfile(event) {
    event.preventDefault();
    try {
      await api("/me/profile", {
        method: "PATCH",
        body: {
          displayName: profileForm.displayName,
          bio: profileForm.bio,
          avatarUrl: profileForm.avatarUrl || undefined,
          interests: profileForm.interests
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        }
      });
      setShowProfileEditor(false);
      await loadDashboard();
      setStatus("Profile updated.");
    } catch (error) {
      setStatus(`Profile update failed: ${error.message}`);
    }
  }

  async function createGroup(event) {
    event.preventDefault();
    try {
      await api("/groups", { method: "POST", body: groupForm });
      setGroupForm({ name: "", description: "" });
      await loadDashboard();
      setStatus("Group created.");
    } catch (error) {
      setStatus(`Group create failed: ${error.message}`);
    }
  }

  async function requestJoin(groupId) {
    try {
      await api(`/groups/${groupId}/request-join`, { method: "POST" });
      await loadDashboard();
      setStatus("Join request sent.");
    } catch (error) {
      setStatus(`Join request failed: ${error.message}`);
    }
  }

  async function approveFirstPending(groupId) {
    try {
      const detail = await api(`/groups/${groupId}`);
      const pendingUserId = detail.group.joinRequestIds?.[0];
      if (!pendingUserId) {
        setStatus("No pending join request.");
        return;
      }
      await api(`/groups/${groupId}/approve/${pendingUserId}`, { method: "POST" });
      await loadDashboard();
      setStatus("Join request approved.");
    } catch (error) {
      setStatus(`Approve failed: ${error.message}`);
    }
  }

  async function createPost(event) {
    event.preventDefault();
    try {
      await api("/posts", {
        method: "POST",
        body: {
          caption: composerForm.caption,
          videoUrl: composerForm.videoUrl,
          visibility: composerForm.visibility,
          groupId: composerForm.groupId || undefined
        }
      });
      setComposerForm((current) => ({ ...current, caption: "", videoUrl: "" }));
      await loadDashboard();
      setStatus("Post published.");
    } catch (error) {
      setStatus(`Post failed: ${error.message}`);
    }
  }

  async function openPost(postId) {
    setSelectedPostId(postId);
    try {
      const [chainResult, commentResult] = await Promise.all([
        api(`/posts/${postId}/reaction-chain`),
        api(`/posts/${postId}/comments`)
      ]);
      setChain(chainResult.chain || []);
      setComments(commentResult.comments || []);
      setStatus("Opened chain studio.");
    } catch (error) {
      setStatus(`Open post failed: ${error.message}`);
    }
  }

  async function reactToSelected(event) {
    event.preventDefault();
    if (!selectedPostId) {
      setStatus("Select a post before reacting.");
      return;
    }
    try {
      await api(`/posts/${selectedPostId}/reactions`, {
        method: "POST",
        body: {
          videoUrl: reactionForm.videoUrl,
          parentReactionId: reactionForm.parentReactionId || undefined
        }
      });
      setReactionForm({ videoUrl: "", parentReactionId: "" });
      await openPost(selectedPostId);
      await loadDashboard();
      setStatus("Reaction added.");
    } catch (error) {
      setStatus(`Reaction failed: ${error.message}`);
    }
  }

  async function toggleLike(postId) {
    try {
      await api(`/posts/${postId}/like`, { method: "POST" });
      await loadDashboard();
      if (selectedPostId === postId) await openPost(postId);
      setStatus("Like state updated.");
    } catch (error) {
      setStatus(`Like failed: ${error.message}`);
    }
  }

  async function addComment(event) {
    event.preventDefault();
    if (!selectedPostId) {
      setStatus("Select a post before commenting.");
      return;
    }
    try {
      await api(`/posts/${selectedPostId}/comments`, {
        method: "POST",
        body: { text: commentDraft }
      });
      setCommentDraft("");
      await openPost(selectedPostId);
      await loadDashboard();
      setStatus("Comment posted.");
    } catch (error) {
      setStatus(`Comment failed: ${error.message}`);
    }
  }

  async function followUser(userId) {
    try {
      await api(`/users/${userId}/follow`, { method: "POST" });
      await loadDashboard();
      setStatus("Followed user.");
    } catch (error) {
      setStatus(`Follow failed: ${error.message}`);
    }
  }

  async function reportPost(postId) {
    try {
      await api("/reports", {
        method: "POST",
        body: {
          targetType: "post",
          targetId: postId,
          reason: "Community report from demo UI"
        }
      });
      await loadDashboard();
      setStatus("Report submitted.");
    } catch (error) {
      setStatus(`Report failed: ${error.message}`);
    }
  }

  async function blockUser(userId) {
    try {
      await api(`/safety/block/${userId}`, { method: "POST" });
      await loadDashboard();
      setStatus("User blocked.");
    } catch (error) {
      setStatus(`Block failed: ${error.message}`);
    }
  }

  async function muteUser(userId) {
    try {
      await api(`/safety/mute/${userId}`, { method: "POST" });
      await loadDashboard();
      setStatus("User muted.");
    } catch (error) {
      setStatus(`Mute failed: ${error.message}`);
    }
  }

  async function markRead(notificationId) {
    try {
      await api(`/notifications/${notificationId}/read`, { method: "POST" });
      await loadDashboard();
    } catch (error) {
      setStatus(`Notification update failed: ${error.message}`);
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">FB</span>
          <div>
            <h1>FirstBlush</h1>
            <p>Authentic reaction network</p>
          </div>
        </div>

        <div className="topbar-controls">
          <button type="button" className="ghost" onClick={() => quickSignIn("apple", "Demo Apple")}>
            Quick Apple
          </button>
          <button type="button" className="ghost" onClick={() => quickSignIn("google", "Demo Google")}>
            Quick Google
          </button>
          <select value={activeToken} onChange={(event) => setActiveToken(event.target.value)}>
            <option value="">Select account</option>
            {accounts.map((account) => (
              <option key={account.token} value={account.token}>
                {account.displayName} ({account.provider})
              </option>
            ))}
          </select>
          <button type="button" onClick={loadDashboard} disabled={!activeToken}>
            Refresh
          </button>
          <button type="button" className="danger" onClick={logout} disabled={!activeToken}>
            Logout
          </button>
        </div>
      </header>

      <div className="status">{message}</div>

      {!activeToken && (
        <section className="signin-panel">
          <h2>Sign in</h2>
          <p>Use any long token string for demo auth.</p>
          <form onSubmit={signIn} className="signin-grid">
            <select
              value={authForm.provider}
              onChange={(event) => setAuthForm((current) => ({ ...current, provider: event.target.value }))}
            >
              <option value="apple">apple</option>
              <option value="google">google</option>
            </select>
            <input
              placeholder="id token"
              value={authForm.idToken}
              onChange={(event) => setAuthForm((current) => ({ ...current, idToken: event.target.value }))}
            />
            <input
              placeholder="display name"
              value={authForm.displayName}
              onChange={(event) => setAuthForm((current) => ({ ...current, displayName: event.target.value }))}
            />
            <button type="submit">Enter FirstBlush</button>
          </form>
        </section>
      )}

      <main className="layout">
        <aside className="left-rail">
          <section className="panel profile-card">
            <div className="avatar">{initials(activeUser?.displayName)}</div>
            <h3>{activeUser?.displayName || "No active user"}</h3>
            <p>{activeUser?.bio || "No bio yet. Add one to make the profile feel real."}</p>
            {activeUser && (
              <button type="button" className="ghost" onClick={() => setShowProfileEditor((open) => !open)}>
                {showProfileEditor ? "Close editor" : "Edit profile"}
              </button>
            )}

            {showProfileEditor && (
              <form onSubmit={updateProfile} className="stack">
                <input
                  placeholder="display name"
                  value={profileForm.displayName}
                  onChange={(event) => setProfileForm((current) => ({ ...current, displayName: event.target.value }))}
                />
                <input
                  placeholder="avatar URL"
                  value={profileForm.avatarUrl}
                  onChange={(event) => setProfileForm((current) => ({ ...current, avatarUrl: event.target.value }))}
                />
                <textarea
                  rows={3}
                  placeholder="bio"
                  value={profileForm.bio}
                  onChange={(event) => setProfileForm((current) => ({ ...current, bio: event.target.value }))}
                />
                <input
                  placeholder="interests, comma separated"
                  value={profileForm.interests}
                  onChange={(event) => setProfileForm((current) => ({ ...current, interests: event.target.value }))}
                />
                <button type="submit">Save profile</button>
              </form>
            )}
          </section>

          <section className="panel">
            <h3>Groups</h3>
            <form onSubmit={createGroup} className="stack compact">
              <input
                placeholder="group name"
                value={groupForm.name}
                onChange={(event) => setGroupForm((current) => ({ ...current, name: event.target.value }))}
              />
              <input
                placeholder="description"
                value={groupForm.description}
                onChange={(event) => setGroupForm((current) => ({ ...current, description: event.target.value }))}
              />
              <button type="submit">Create group</button>
            </form>

            <div className="stack">
              {groups.map((group) => (
                <article key={group.id} className="item">
                  <strong>{group.name}</strong>
                  <p>{group.description}</p>
                  <p className="meta">
                    Members {group.memberCount} • Pending {group.joinRequestCount}
                  </p>
                  <div className="row">
                    <button type="button" className="ghost" onClick={() => requestJoin(group.id)}>
                      Request join
                    </button>
                    {group.joinRequestCount > 0 && (
                      <button type="button" className="ghost" onClick={() => approveFirstPending(group.id)}>
                        Approve pending
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <h3>Safety edges</h3>
            {safetyEdges.length === 0 && <p className="meta">No muted/blocked users yet.</p>}
            <ul className="simple-list">
              {safetyEdges.map((edge) => (
                <li key={`${edge.actorId}-${edge.targetId}-${edge.edgeType}`}>
                  {edge.edgeType} {edge.targetId.slice(0, 8)}
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <section className="feed-column">
          <section className="panel composer">
            <h2>Create a seed moment</h2>
            <form onSubmit={createPost} className="stack">
              <textarea
                rows={2}
                placeholder="What happened right now?"
                value={composerForm.caption}
                onChange={(event) => setComposerForm((current) => ({ ...current, caption: event.target.value }))}
              />
              <input
                placeholder="video URL (demo)"
                value={composerForm.videoUrl}
                onChange={(event) => setComposerForm((current) => ({ ...current, videoUrl: event.target.value }))}
              />
              <div className="row">
                <select
                  value={composerForm.visibility}
                  onChange={(event) => setComposerForm((current) => ({ ...current, visibility: event.target.value }))}
                >
                  <option value="public">public</option>
                  <option value="group">group</option>
                </select>
                <select
                  value={composerForm.groupId}
                  onChange={(event) => setComposerForm((current) => ({ ...current, groupId: event.target.value }))}
                >
                  <option value="">No group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <button type="submit">Post now</button>
              </div>
            </form>
          </section>

          <section className="stack">
            {feed.length === 0 && (
              <article className="panel empty">
                <h3>No moments yet</h3>
                <p>Create a seed post to populate the feed.</p>
              </article>
            )}

            {feed.map((post) => (
              <article key={post.id} className={`panel post-card ${selectedPostId === post.id ? "active" : ""}`}>
                <header className="post-head">
                  <div className="avatar small">{initials(post.author?.displayName || "U")}</div>
                  <div>
                    <strong>{post.author?.displayName || post.userId.slice(0, 8)}</strong>
                    <p className="meta">{niceTime(post.createdAt)}</p>
                  </div>
                </header>

                <p className="caption">{post.caption || "(no caption)"}</p>
                <a href={post.videoUrl} target="_blank" rel="noreferrer" className="video-link">
                  {post.videoUrl}
                </a>

                <footer className="post-actions">
                  <button type="button" onClick={() => openPost(post.id)}>
                    Chain
                  </button>
                  <button type="button" className="ghost" onClick={() => toggleLike(post.id)}>
                    Like ({post.likeCount})
                  </button>
                  <button type="button" className="ghost" onClick={() => reportPost(post.id)}>
                    Report
                  </button>
                  <button type="button" className="ghost" onClick={() => muteUser(post.userId)}>
                    Mute
                  </button>
                  <button type="button" className="ghost" onClick={() => blockUser(post.userId)}>
                    Block
                  </button>
                </footer>
                <p className="meta">
                  {post.reactionCount} reactions • {post.commentCount} comments • visibility {post.visibility}
                </p>
              </article>
            ))}
          </section>
        </section>

        <aside className="right-rail">
          <section className="panel">
            <h3>Chain Studio</h3>
            {!selectedPost && <p className="meta">Pick a post from the feed.</p>}
            {selectedPost && (
              <>
                <p className="meta">Selected post: {selectedPost.caption || selectedPost.id.slice(0, 8)}</p>
                <form onSubmit={reactToSelected} className="stack compact">
                  <input
                    placeholder="reaction video URL"
                    value={reactionForm.videoUrl}
                    onChange={(event) => setReactionForm((current) => ({ ...current, videoUrl: event.target.value }))}
                  />
                  <input
                    placeholder="parent reaction id (optional)"
                    value={reactionForm.parentReactionId}
                    onChange={(event) =>
                      setReactionForm((current) => ({ ...current, parentReactionId: event.target.value }))
                    }
                  />
                  <button type="submit">Add reaction</button>
                </form>

                <ul className="simple-list">
                  {chain.map((item) => (
                    <li key={item.id}>
                      #{item.position} {item.userId.slice(0, 8)}
                    </li>
                  ))}
                </ul>

                <form onSubmit={addComment} className="stack compact">
                  <input
                    placeholder="comment"
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                  />
                  <button type="submit">Add comment</button>
                </form>

                <ul className="simple-list">
                  {comments.map((item) => (
                    <li key={item.id}>
                      {item.userId.slice(0, 8)}: {item.text}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="panel">
            <h3>Notifications</h3>
            {notifications.length === 0 && <p className="meta">No notifications.</p>}
            <ul className="simple-list">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <strong>{notification.type}</strong>
                  <span>{notification.message}</span>
                  {!notification.readAt && (
                    <button type="button" className="tiny" onClick={() => markRead(notification.id)}>
                      mark read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h3>Creator metrics</h3>
            {!metrics && <p className="meta">No metrics yet.</p>}
            {metrics && (
              <ul className="simple-list">
                <li>Posts: {metrics.posts}</li>
                <li>Reactions received: {metrics.reactionsReceived}</li>
                <li>Likes received: {metrics.likesReceived}</li>
                <li>Comments received: {metrics.commentsReceived}</li>
                <li>Followers: {metrics.followers}</li>
              </ul>
            )}
          </section>

          <section className="panel">
            <h3>Discover people</h3>
            <ul className="simple-list">
              {users.map((user) => (
                <li key={user.id}>
                  <span>{user.displayName}</span>
                  <button type="button" className="tiny" onClick={() => followUser(user.id)}>
                    follow
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </main>

      <details className="dev-panel">
        <summary>Manual auth panel</summary>
        <form onSubmit={signIn} className="signin-grid">
          <select
            value={authForm.provider}
            onChange={(event) => setAuthForm((current) => ({ ...current, provider: event.target.value }))}
          >
            <option value="apple">apple</option>
            <option value="google">google</option>
          </select>
          <input
            placeholder="id token"
            value={authForm.idToken}
            onChange={(event) => setAuthForm((current) => ({ ...current, idToken: event.target.value }))}
          />
          <input
            placeholder="display name"
            value={authForm.displayName}
            onChange={(event) => setAuthForm((current) => ({ ...current, displayName: event.target.value }))}
          />
          <button type="submit">Sign in</button>
        </form>
      </details>
    </div>
  );
}
