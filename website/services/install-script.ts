import { ApiClient, CreateSessionResponse } from "./api-client";
import { SessionKeys } from "./session";

export enum InstallScriptType {
  Local,
  Target,
}

export interface InstallScript {
  types: InstallScriptType[];
  name: string;
  lang: string;
  canBePublic: boolean;
  scriptFactory: (args: string[]) => string;
}

const INSTALL_SCRIPTS: InstallScript[] = [
  {
    types: [InstallScriptType.Local],
    name: "Unix (curl)",
    lang: "bash",
    canBePublic: true,
    scriptFactory: (args) => `sh <(curl -sSf https://lets.tunshell.com/init.sh) ${args.join(" ")}`,
  },
  {
    types: [InstallScriptType.Target],
    name: "Unix (curl)",
    lang: "bash",
    canBePublic: true,
    scriptFactory: (args) => `curl -sSf https://lets.tunshell.com/init.sh | sh /dev/stdin ${args.join(" ")}`,
  },
  {
    types: [InstallScriptType.Local],
    name: "Unix (wget)",
    lang: "bash",
    canBePublic: true,
    scriptFactory: (args) =>
      `sh <(wget https://lets.tunshell.com/init.sh -O /dev/stdout 2> /dev/null) ${args.join(" ")}`,
  },
  {
    types: [InstallScriptType.Target],
    name: "Unix (wget)",
    lang: "bash",
    canBePublic: true,
    scriptFactory: (args) =>
      `wget https://lets.tunshell.com/init.sh -O /dev/stdout 2> /dev/null | sh /dev/stdin ${args.join(" ")}`,
  },
  {
    types: [InstallScriptType.Local, InstallScriptType.Target],
    name: "Windows (PowerShell)",
    lang: "powershell",
    canBePublic: true,
    scriptFactory: (args) =>
      `[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12; &amp;$([scriptblock]::Create((New-ObjectSystem.Net.WebClient).DownloadString('https://lets.tunshell.com/init.ps1'))) ${args.join(
        " "
      )}`,
  },
  {
    types: [InstallScriptType.Local],
    name: "Docker",
    lang: "bash",
    canBePublic: false,
    scriptFactory: (args) => `docker run --rm -it timetoogo/tunshell ${args.join(" ")}`,
  },
  {
    types: [InstallScriptType.Target],
    name: "Node.js",
    lang: "javascript",
    canBePublic: false,
    scriptFactory: (args) =>
      `require('https').get('https://lets.tunshell.com/init.js',r=>{let s="";r.setEncoding('utf8');r.on('data',(d)=>s+=d);r.on('end',()=>require('vm').runInNewContext(s,{require,args:${JSON.stringify(
        args
      )}}))});`,
  },
  {
    types: [InstallScriptType.Target],
    name: "Python 3",
    lang: "python",
    canBePublic: false,
    scriptFactory: (args) =>
      `import urllib.request;r=urllib.request.urlopen('https://lets.tunshell.com/init.py') ;exec(r.read().decode('utf-8'),{'p':${JSON.stringify(
        args
      )}})`,
  },
  {
    types: [InstallScriptType.Target],
    name: ".NET Core",
    lang: "csharp",
    canBePublic: false,
    scriptFactory: (args) =>
      `System.Reflection.Assembly.Load(new System.Net.WebClient().DownloadData("https://lets.tunshell.com/init.dotnet.dll")).EntryPoint.Invoke(null,new []{new string[]{${args
        .map((i) => JSON.stringify(i))
        .join(",")}}});`,
  },
  {
    types: [InstallScriptType.Target],
    name: "Java",
    lang: "java",
    canBePublic: false,
    scriptFactory: (args) =>
      `new URLClassLoader(new URL[]{new URL("https://lets.tunshell.com/init.jar")}).loadClass("init").getMethod("main",String[].class).invoke(null,(Object)new String[]{${args
        .map((i) => JSON.stringify(i))
        .join(",")}});`,
  },
  {
    types: [InstallScriptType.Target],
    name: "PHP",
    lang: "php",
    canBePublic: false,
    scriptFactory: (args) =>
      `(eval(file_get_contents('https://lets.tunshell.com/init.php')))(${JSON.stringify(args)});`,
  },
];

export class InstallScriptService {
  public static getOptions = (type: InstallScriptType): InstallScript[] => {
    return INSTALL_SCRIPTS.filter((i) => i.types.includes(type));
  };

  public static getScript = (type: InstallScriptType, scriptName: string): InstallScript => {
    return InstallScriptService.getOptions(type).find((i) => i.name === scriptName);
  };

  public renderInstallScript = (
    type: InstallScriptType,
    scriptName: string,
    session: SessionKeys,
    argsOverride?: string[]
  ): string => {
    const script = InstallScriptService.getScript(type, scriptName);
    const args = argsOverride || this.getSessionArgs(type, session);

    return script.scriptFactory(args);
  };

  public getSessionArgs = (type: InstallScriptType, session: SessionKeys): string[] => {
    return type === InstallScriptType.Local
      ? ["L", session.localKey, session.encryptionSecret]
      : ["T", session.targetKey, session.encryptionSecret];
  };
}