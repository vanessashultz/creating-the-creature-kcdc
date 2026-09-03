import { Routes } from '@angular/router';
import { Example1 } from './example1/example1';
import { Example2 } from './example2/example2';
import { Example3 } from './example3/example3';

export const routes: Routes = [
  { path: '', redirectTo: 'example1', pathMatch: 'full' },
  { path: 'example1', component: Example1 },
  { path: 'example2', component: Example2 },
  { path: 'example3', component: Example3 },
];
