var _jm = null;
function open_empty() {
  var options = {
    container: "jsmind_container",
    theme: "greensea",
    editable: true,
    log_level: "debug",
    view: {
      engine: "canvas",
      draggable: true,
      enable_device_pixel_ratio: false,
    },
    plugin: {
      screenshot: {
        background: "#ffffff",
      },
    },
  };
  _jm = new jsMind(options);
  _jm.show();
}

function open_json() {
    var markdownExample = `    # 费曼学习法
    ## 1. 理解
    ### 1.1 选择一个主题
    ### 1.2 研究和学习
    ## 2. 教授
    ### 2.1 用简单的语言解释
    ### 2.2 识别知识的盲点
    ## 3. 复习
    ### 3.1 定期回顾
    ### 3.2 深入理解
    `;
    document.querySelector(
        "#markdown_input div[contenteditable]"
      ).innerText=markdownExample;
      md2jm();
}

function convertMarkdownToJsMind(markdown) {
  const mind = {
    meta: {
      name: "Markdown 转换",
      author: "",
      version: "0.3", // 更新版本号
    },
    format: "node_tree",
    data: {
      id: "root",
      topic: "", // 第一级标题将被设置在这里
      children: [],
    },
  };

  markdown.forEach((line) => {
    const level = line.split("#").length - 1; // 计算当前行的层级
    const topic = line.trim().replace(/^#+\s*/, ""); // 提取主题
    // 增加对空主题的处理
    if (topic.length === 0) {
      return; // 跳过空主题
    }

    // 创建节点的函数
    const createNode = (topic) => ({
      id: jsMind.util.uuid.newid(), // 使用随机生成的ID
      topic: topic,
      direction: level === 2 ? "right" : "left", // 二级标题方向统一,其他层级方向为左
      children: [],
      "background-color": "rgba(30, 144, 255, 0.7)", // 设置透明背景颜色
      "foreground-color": "#fff", // 更改前景颜色为白色
      "font-size": "22px", // 设置字体大小为22px
      "font-weight": "bold", // 设置字体为加粗
      "border": "2px solid #ff1493", // 更新边框颜色
      "border-radius": "8px", // 设置圆角
      "padding": "5px", // 添加内边距
    });

    if (level === 1) {
      mind.data.topic = topic; // 将第一级标题设置为data.topic
    } else if (level === 2) { // 处理二级标题
      let currentLevel = mind.data; // 从根节点开始
      const newNode = createNode(topic);
      currentLevel.children.push(newNode); // 添加到当前层级的children
      currentLevel = newNode; // 更新currentLevel为新创建的节点
    } else if (level === 3) { // 处理三级标题
      let currentLevel = mind.data.children[mind.data.children.length - 1]; // 从最后一个二级节点开始
      const newNode = createNode(topic);
      if (!currentLevel.children) {
        currentLevel.children = [];
      }
      currentLevel.children.push(newNode); // 添加到当前层级的children
    } else if (level > 3) { // 处理四级及以上标题
      let currentLevel = mind.data.children[mind.data.children.length - 1].children[mind.data.children[mind.data.children.length - 1].children.length - 1]; // 从最后一个三级节点开始
      for (let i = 4; i <= level; i++) {
        // 如果当前层级的children不存在,则初始化为一个空数组
        if (!currentLevel.children) {
          currentLevel.children = [];
        }
        // 查找当前层级的节点
        let existingNode = currentLevel.children.find(child => child.topic === topic);
        if (!existingNode) {
          const newNode = createNode(topic);
          currentLevel.children.push(newNode); // 添加到当前层级的children
          currentLevel = newNode; // 更新currentLevel为新创建的节点
        } else {
          currentLevel = existingNode; // 更新currentLevel为已存在的节点
        }
      }
    }
  });
  return mind;
}

function md2jm() {
  var markdown_text = document.querySelector(
    "#markdown_input div[contenteditable]"
  ).innerText;
  console.log(markdown_text);
  const markdown = markdown_text.trim().split("\n");

  // 检查是否为空行或不符合 Markdown 格式
  if (markdown.length === 0 || !markdown[0].startsWith("#")) {
    alert("输入的文本不符合 Markdown 格式");
    return;
  }

  const mind = convertMarkdownToJsMind(markdown);

  // 检查是否有有效的节点
  if (mind.data.children.length === 0) {
    alert("没有有效的 Markdown 内容转换为思维导图");
    return;
  }

  _jm.show(mind);
}


function screen_shot() {
  _jm.shoot();
}

function show_data() {
  var mind_data = _jm.get_data();
  var mind_string = jsMind.util.json.json2string(mind_data);
  prompt_info(mind_string);
}

function save_file() {
  var mind_data = _jm.get_data();
  var mind_name = mind_data.meta.name;
  var mind_str = jsMind.util.json.json2string(mind_data);
  jsMind.util.file.save(mind_str, "text/jsmind", mind_name + ".jm");
}

function show_selected() {
  var selected_node = _jm.get_selected_node();
  if (!!selected_node) {
    prompt_info(selected_node.topic);
  } else {
    prompt_info("nothing");
  }
}

function get_selected_nodeid() {
  var selected_node = _jm.get_selected_node();
  if (!!selected_node) {
    return selected_node.id;
  } else {
    return null;
  }
}

function add_node() {
  var selected_node = _jm.get_selected_node(); // as parent of new node
  if (!selected_node) {
    prompt_info("please select a node first.");
    return;
  }

  var nodeid = jsMind.util.uuid.newid();
  var topic = "* Node_" + nodeid.substr(nodeid.length - 6) + " *";
  var node = _jm.add_node(selected_node, nodeid, topic);
}

var imageChooser = document.getElementById("image-chooser");

imageChooser.addEventListener(
  "change",
  function (event) {
    // Read file here.
    var reader = new FileReader();
    reader.onloadend = function () {
      var selected_node = _jm.get_selected_node();
      var nodeid = jsMind.util.uuid.newid();
      var topic = undefined;
      var data = {
        "background-image": reader.result,
        width: "100",
        height: "100",
      };
      var node = _jm.add_node(selected_node, nodeid, topic, data);
    };

    var file = imageChooser.files[0];
    if (file) {
      reader.readAsDataURL(file);
    }
  },
  false
);

 

function set_theme(theme_name) {
  _jm.set_theme(theme_name);
}

var zoomInButton = document.getElementById("zoom-in-button");
var zoomOutButton = document.getElementById("zoom-out-button");

 

function toggle_editable(btn) {
  var editable = _jm.get_editable();
  if (editable) {
    _jm.disable_edit();
    btn.innerHTML = "enable editable";
  } else {
    _jm.enable_edit();
    btn.innerHTML = "disable editable";
  }
}



function resize_jsmind() {
  _jm.resize();
}

 

  
function expand_all() {
  _jm.expand_all();
}

function expand_to_level2() {
  _jm.expand_to_depth(2);
}

function expand_to_level3() {
  _jm.expand_to_depth(3);
}

function collapse_all() {
  _jm.collapse_all();
}

function get_nodearray_data() {
  var mind_data = _jm.get_data("node_array");
  var mind_string = jsMind.util.json.json2string(mind_data);
  prompt_info(mind_string);
}

function save_nodearray_file() {
  var mind_data = _jm.get_data("node_array");
  var mind_name = mind_data.meta.name;
  var mind_str = jsMind.util.json.json2string(mind_data);
  jsMind.util.file.save(mind_str, "text/jsmind", mind_name + ".jm");
}

function open_nodearray() {
  var file_input = document.getElementById("file_input_nodearray");
  var files = file_input.files;
  if (files.length > 0) {
    var file_data = files[0];
    jsMind.util.file.read(file_data, function (jsmind_data, jsmind_name) {
      var mind = jsMind.util.json.string2json(jsmind_data);
      if (!!mind) {
        _jm.show(mind);
      } else {
        prompt_info("can not open this file as mindmap");
      }
    });
  } else {
    prompt_info("please choose a file first");
  }
}

function get_freemind_data() {
  var mind_data = _jm.get_data("freemind");
  var mind_string = jsMind.util.json.json2string(mind_data);
  alert(mind_string);
}

function save_freemind_file() {
  var mind_data = _jm.get_data("freemind");
  var mind_name = mind_data.meta.name || "freemind";
  var mind_str = mind_data.data;
  jsMind.util.file.save(mind_str, "text/xml", mind_name + ".mm");
}

function open_freemind() {
  var file_input = document.getElementById("file_input_freemind");
  var files = file_input.files;
  if (files.length > 0) {
    var file_data = files[0];
    jsMind.util.file.read(file_data, function (freemind_data, freemind_name) {
      if (freemind_data) {
        var mind_name = freemind_name;
        if (/.*\.mm$/.test(mind_name)) {
          mind_name = freemind_name.substring(0, freemind_name.length - 3);
        }
        var mind = {
          meta: {
            name: mind_name,
            author: "",
            version: "1.0.1",
          },
          format: "freemind",
          data: freemind_data,
        };
        _jm.show(mind);
      } else {
        prompt_info("can not open this file as mindmap");
      }
    });
  } else {
    prompt_info("please choose a file first");
  }
}

function prompt_info(msg) {
  alert(msg);
}

open_empty();
open_json();
toggle_background_color();
function toggle_background_color() {
  const body = document.body;
  const jsmindElement = document.querySelector(".jsmind");
  // markdown_input
  const markdown_input = document.querySelector("#markdown_input");
  // jsmind_nav
  const jsmind_nav = document.querySelector("#jsmind_nav");
  const isBlackBackground = body.style.backgroundColor === "black";

  // 切换背景颜色和文本颜色
  body.style.backgroundColor = isBlackBackground ? "white" : "black";
  body.style.color = isBlackBackground ? "black" : "white";
  jsmindElement.style.backgroundColor = isBlackBackground ? "#f4f4f4" : "#333";
  markdown_input.style.backgroundColor = isBlackBackground ? "#f4f4f4" : "#333";
  jsmind_nav.style.backgroundColor = isBlackBackground ? "#f4f4f4" : "#333";
  // 更新其他页面元素的颜色
  const allElements = document.querySelectorAll("h1, h2, h3, p, button, input, textarea");
  allElements.forEach((element) => {
    element.style.color = isBlackBackground ? "black" : "white"; // 更新文本颜色
    if (element.tagName === "BUTTON") {
      element.style.backgroundColor = isBlackBackground ? "#f0f0f0" : "#555"; // 更新按钮背景颜色
    }
  });
}