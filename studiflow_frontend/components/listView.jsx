// import Filters from './filters';
import HeatMap from './heatMap';
import ListViewCourses from './listViewCourses';

export default function ListView() {
  return (
    <>
      <div className="flex mx-8 space-x-8">
        {/* <Filters /> */}
        <HeatMap />
        <ListViewCourses />
      </div>
    </>
  );
}
