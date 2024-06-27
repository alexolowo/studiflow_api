import Filters from "./filters"
import ListViewCourses from "./listViewCourses"

export default function ListView() {
    return (
        <>
            <div className="flex mx-8 space-x-8">
                <Filters />
                <ListViewCourses />
            </div>
        </>
    )
}