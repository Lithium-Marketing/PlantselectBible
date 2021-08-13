import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router'
import Home from '../views/Home.vue'
import Products from "@/views/Products.vue";
import OAs from "@/views/OAs.vue";
import ViewA from "@/views/ViewA.vue";
import Edit from "@/views/Edit.vue";
import Tools from "@/views/Tools.vue";

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'Home',
        component: Home
    }, {
        path: '/edit',
        name: 'Edit',
        component: Edit
    }, {
        path: '/viewA',
        name: 'ViewA',
        component: ViewA
    }, {
        path: '/products',
        name: 'Products',
        component: Products
    }, {
        path: '/oas',
        name: 'OAs',
        component: OAs
    }, {
        path: '/tools',
        name: 'Tools',
        component: Tools
    }, {
        path: '/about',
        name: 'About',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

export default router
