openlens平时常用的插件功能的打包集合

包含功能:

1. node shell (lens有但openlens 没有的功能)

2. pod shell (lens有但openlens 没有的功能)

3. ingress和secret tls证书过期时间查看 (lens 没有的功能)

4. 多个pod查看日志功能 (lens 没有的功能)
 
   注:需要先安装 https://github.com/stern/stern 并加到PATH环境变量

5. pod文件管理器功能 (lens 没有的功能)

6. helm release导出功能（导出为原始chart文件+自定义values） (lens 没有的功能)

7.ingress 链路图展示+ 根据url搜索 ingress链路图功能  (lens 没有的功能)

8. 整合netpolicy插件功能 (lens 没有的功能)

9. nodemerics ,podmerics ，compoenentstatus展示 (lens 没有的功能)

构建:

build.bat

install:

install openlens-plugins-integration-suite-1.1.6.tgz