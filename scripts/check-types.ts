import ts from 'typescript';
import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
let count=0;
function scan(dir:string){for(const entry of readdirSync(dir,{withFileTypes:true})){const file=join(dir,entry.name);if(entry.isDirectory())scan(file);else if(/\.tsx?$/.test(file)){const source=ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);function walk(node:ts.Node){if(ts.isAsExpression(node)||ts.isTypeAssertionExpression(node)||ts.isNonNullExpression(node)||node.kind===ts.SyntaxKind.AnyKeyword)throw new Error(`Unsafe type syntax: ${file}:${source.getLineAndCharacterOfPosition(node.getStart()).line+1}`);ts.forEachChild(node,walk);}walk(source);if(/@ts-(ignore|nocheck|expect-error)/.test(source.text))throw new Error('Type suppression: '+file);count++;}}}
for(const dir of ['src','tests','scripts'])scan(dir);console.log(`Type syntax checked: ${count} files`);
