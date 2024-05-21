import Post from '../Post';
import { useEffect, useState } from 'react';

export default function BlogPage(){
    const [posts,setPosts] = useState([]);
    useEffect(() => {
        fetch('http://localhost:4000/post').then(response => {
            response.json().then(posts => {
                setPosts(posts);
            });
        });
    }, []);
    return (
        <>
            <div className='post-list-container'>
                <div className='post-list'>
                    <h1 className='post-title'>PUBLICACIONES</h1>
                    {posts.length > 0 && posts.map(post => (
                        <Post {...post}/>
                    ))}
                </div>
            </div>
            
            
        </>
    )
}