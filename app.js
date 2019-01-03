var express = require("express");
var app = express();
var superAgent = require("superagent");
var fs = require("fs");
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));
var cookieParser = require("cookie-parser");
//处理文件上传
var multer = require("multer");

app.use(express.static("www"));

//注册接口第一步-短信验证-生成验证码
function code(){
    var ste = "1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
    var code = "";
    for(var i=0 ; i < 4 ; i++){
        code += ste[Math.floor(Math.random() * ste.length)];
    }
    return code;
}
var codes = {};//保存所有的验证码
app.get("/sendcode",function(req,res){
    var telcode = code();
    var url = "http://sms.tehir.cn/code/sms/api/v1/send?srcSeqId=123&account=19905932859&password=2022876250&mobile="+ req.query.tel +"&code=" + telcode + "&time=1";
    superAgent.get(url).end(function(err,resData){
        if(err){
            res.status(200).json(err);
        }else{
            console.log(telcode);
            codes[req.query.tel]=telcode;
            res.status(200).json(resData.body);
        }
    });
});

app.get("/register",function(req,res){
    // console.log(codes[req.query.tel]);
    // console.log(req.query.code);
    if(codes[req.query.tel].toUpperCase() == req.query.code.toUpperCase()){
        res.send("验证成功");
        location.href="register2.html";

    }else{
        res.send("验证失败,验证码有误");
    }
});


// 注册接口第二步
app.post("/register2",function(req,res){
    console.log(req.body);
    if(req.body.password != req.body.password2){
        res.status(200).json({
            code:1,
            info:"注册失败,两次密码输入不一致"
        });
        return;
    }
    fs.exists("users",function(ex){
        if(ex){
            fs.exists("users/" + req.body.user + ".txt",function(ex2){
                console.log(ex2);
                if(ex2){
                    res.status(200).json({
                        code:3,
                        info:"注册失败,该用户已存在"
                    });
                }else{
                    writeFile();
                }
            });
        }else{
            fs.mkdir("users",function(err){
                if(err){
                    res.status(200).json({
                        code:2,
                        info:"注册失败,创建文件夹失败"
                    });
                }else{
                    writeFile();
                }
            });
        }
    });
    //保存该用户
    function writeFile(){
        fs.writeFile("users/" + req.body.user + ".txt",JSON.stringify(req.body),function(err){
            if(err){
                res.status(200).json({
                    code:4,
                    info:"注册失败,文件写入失败"
                });
            }else{
                res.status(200).json({
                    code:0,
                    info:"注册成功"
                });
            }
        });
    }
});
//登入接口
app.post("/login",function(req,res){
    var filename = "users/" + req.body.user + ".txt";
    // console.log(req.body);
    fs.exists(filename,function(ex){
        if(ex){
            //存在
            fs.readFile(filename,"UTF-8",function(err,data){
                if(err){
                    res.status(200).json({
                        code:2,
                        info:"登入失败,系统异常"
                    });
                }else{
                    if(JSON.parse(data).password == req.body.password){
                        res.status(200).json({
                            code:0,
                            info:"登入成功"
                        });
                    }else{
                        res.status(200).json({
                            code:3,
                            info:"登入失败,密码错误"
                        });
                    }
                }
            });
        }else{
            res.status(200).json({
                code:1,
                info:"登入失败,该用户不存在"
            });
        }
    });
});
app.listen(3000,function(){
    console.log("服务器开启中...");
});