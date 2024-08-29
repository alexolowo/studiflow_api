'use client';

import EditProfileForm from '@/components/editProfile';
import React, { useState, useEffect } from 'react';

const Profile = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('https://studiflow-a4bd949e558f.herokuapp.com/auth/login/', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setData(data);
      } catch (error) {
        console.error('There was an error fetching user details!', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <div className="mx-96 my-8 text-4xl">Profile</div>
      <div className="mx-96">{data && <EditProfileForm initialData={data} />}</div>
    </div>
  );
};

export default Profile;
