<template>
    <div>
      <search-component></search-component>
    </div>
  </template>
  
<script>
import { db } from '@/firebase';
import { collection, query, where, getDocs} from "firebase/firestore";

export default{
    data(){
        return{
            searchTerm: '',
            searchResults:[],
        };
    },
    methods: {
        async search(){
            const q = query(collection(db, "userPosts"), where('title', 'array-contains', searchTerm));
            await getDocs(collection(db, ""), {

				});
            
            try{

            }
            catch(error){
                console.error('Search Error: ', error);
            }

        },
    },
};
</script>