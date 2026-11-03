import React from 'react';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {BrandCheck} from '../src/ui.js';
test('criteria and providers are visibly separate before evaluation',()=>{const html=renderToStaticMarkup(<BrandCheck/>);assert.match(html,/面白い実践・学び/);assert.match(html,/仕事で頼れる専門性/);assert.match(html,/OpenAI Decisionsの評価/);assert.match(html,/TypeSafe Jevの評価/);assert.match(html,/基準・指示文/);assert.match(html,/テスト比較結果/);});
