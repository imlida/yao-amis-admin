/**
 * 
 * 
 * yao run scripts.system.account.UserInfo
 * 
 * @returns 当前登录用户的信息
 */
function UserInfo(id) {
  let user_id = Process("session.get", "user_id");
  if (id) {
    user_id = id;
  }
  const q = new Query();
  const user = q.First({
    // "debug": true,
    select: [
      "id",
      "name",
      "created_at",
      "email",
      "extra",
      //   "idcard",
      "key",
      "mobile",
      //   "password",
      //   "password2nd",
      //   "secret",
      "status",
      "type",
      "updated_at",
    ],
    wheres: [
      { ":deleted_at": "删除", "=": null },
      { field: "id", op: "=", value: user_id }, //使用传入参数
    ],
    from: "$admin.user",
    limit: 1,
  });
  if (user) {
    user.extra = JSON.parse(user.extra);
  }
  return user;
}

/**
 * yao run scripts.system.account.UserList
 * @returns 用户列表
 */
function UserList() {
  const q = new Query();
  let list = q.Get({
    // "debug": true,
    select: [
      "id",
      "name",
      "created_at",
      "email",
      "extra",
      //   "idcard",
      "key",
      "mobile",
      //   "password",
      //   "password2nd",
      //   "secret",
      "status",
      "type",
      "updated_at",
    ],
    wheres: [{ ":deleted_at": "删除", "=": null }],
    from: "$admin.user",
    limit: 1000,
  });
  list.forEach((user) => {
    user.extra = JSON.parse(user.extra);
  });
  return list;
}

//已登录用户修改自己的密码
function change_password({ current, new_password, confirm }) {
  const user_id = Process("session.get", "user_id");
  if (!user_id) {
    return Process("scripts.return.Error", "", 400, "用户不存在");
  }
  const q = new Query();
  const user = q.First({
    // debug: true,
    select: ["id", "password"],
    wheres: [
      {
        field: "id",
        value: user_id,
      },
    ],
    from: "$admin.user",
    limit: 1,
  });
  try {
    const password_validate = Process(
      "utils.pwd.Verify",
      current,
      user.password
    );
    if (password_validate !== true) {
      return Process("scripts.return.Error", "", 400, "密码不正确");
    }
  } catch (error) {
    return Process("scripts.return.Error", "", 400, "密码不正确");
  }

  if (new_password !== confirm) {
    return Process("scripts.return.Error", "", 400, "密码不一致");
  }
  user.password = new_password;
  Process("models.admin.user.save", user);
}

/**
 * 新用户注册
 * @param {object} payload 
 * @returns 
 */
function register(payload) {
  let { captcha, password, email, confirm, name } = payload;

  const ok = Process("utils.captcha.Verify", captcha.id, captcha.code);
  if (ok) {
    if (password !== confirm) {
      return Process("scripts.return.Error", "", 400, "密码不一致");
    }

    const q = new Query();
    const user = q.First({
      select: ["id", "name", "password"],
      wheres: [
        {
          field: "name",
          value: email,
        },
        { or: true, field: "email", value: email },
      ],
      from: "$admin.user",
      limit: 1,
    });

    if (user) {
      return Process("scripts.return.Error", "", "400", "用户已存在");
    }

    if (!name) {
      name = email;
    }
    let user1 = {
      email,
      password,
      name,
    };
    try {
      Process("models.admin.user.Create", user1);
    } catch (error) {
      //为了返回的数据好看
      return Process("scripts.return.Error", "", error.code, error.message);
    }
  }
  return {};
}
